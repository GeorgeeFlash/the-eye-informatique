# Inngest Optimization Plan — Reduce Vercel Fluid Active CPU

## Current State Analysis

| Function | Trigger | Pattern | Issues |
|---|---|---|---|
| `monthlyAffiliatePayout` | cron | Sequential loop with per-affiliate `step.run` | No parallelism, no idempotency on sends |
| `immediateAffiliatePayout` | event | Single-step with retries | No function-level idempotency, retries without dedup |
| `installmentDeadlineCheck` | cron | Sequential email loop inside step | No parallelism, no rate limiting |
| `sendEmail` | event | Single step | No idempotency, no batching |
| `lowStockAlertCheck` | cron | Nested sequential loops | No parallelism, manual DB dedup only |
| `activityLogCleanup` / `productPageViewCleanup` | cron | Simple delete | OK as-is |
| `sendBroadcast` (action) | server action | Sequential `inngest.send` loop | No idempotency keys, no parallelism |

**Root causes of high CPU:**
1. **Duplicate event processing** — No `id` on `inngest.send()`, no `idempotency` on functions. Retries and redeliveries re-execute full workflows.
2. **Sequential fan-out** — Loops over affiliates/installments/admins run one-at-a-time instead of in parallel.
3. **No concurrency caps** — Functions can spawn unlimited parallel steps, overwhelming Vercel serverless containers.
4. **No batch processing** — High-volume functions (email, notifications) process one event at a time.
5. **Heavy payloads** — PDF rendering happens in webhook, creating large event payloads sent to Inngest.

---

## Optimization Strategy

### 1. Add Event-Level Idempotency Keys (Dedup)

Every `inngest.send()` call must include a unique, deterministic `id` so Inngest deduplicates within 24h.

**Files to change:**
- `actions/notification.actions.ts` — `sendBroadcast` email loop
- `actions/affiliate.actions.ts` — `approveAffiliate`, `confirmReferralCommission`
- `server/inngest/functions/payout.fn.ts` — monthly payout email sends
- `server/inngest/functions/immediate-payout.fn.ts` — immediate payout email send
- `app/api/webhooks/payunit/route.ts` — payment confirmation email

**Pattern:**
```ts
await inngest.send({
  id: `email-send-${userId}-${template}-${Date.now()}`,
  name: "email/send",
  data: { ... }
})
```

For deterministic keys (preferred for true dedup):
```ts
id: `email-send-${orderId}-${template}`
```

### 2. Add Function-Level Idempotency Config

On event-triggered functions that must not run twice for the same business entity, add `idempotency` to `createFunction` options.

**Target functions:**
- `immediateAffiliatePayout` — `idempotency: "event.data.referralId"` (one payout per referral)
- `sendEmail` — `idempotency: "event.data.to + '-' + event.data.template + '-' + event.data.props.orderId"` (or similar stable key)

**Pattern:**
```ts
export const immediateAffiliatePayout = inngest.createFunction(
  {
    id: "immediate-affiliate-payout",
    retries: 3,
    idempotency: "event.data.referralId",
  },
  { event: "affiliate/immediate-payout" },
  async ({ event, step }) => { ... }
)
```

### 3. Replace Sequential Loops with Parallel `Promise.all` + `step.run`

Fan-out loops should use Inngest's parallel step execution. Each iteration gets a stable step ID for retries and visibility.

**Target functions:**
- `monthlyAffiliatePayout` — parallelize `step.run(`payout-${affiliate.id}`)` calls
- `installmentDeadlineCheck` — parallelize email sends
- `lowStockAlertCheck` — parallelize admin notification creation

**Pattern:**
```ts
// Before: sequential
for (const affiliate of affiliates) {
  await step.run(`payout-${affiliate.id}`, async () => { ... })
}

// After: parallel
const results = await Promise.all(
  affiliates.map((affiliate) =>
    step.run(`payout-${affiliate.id}`, async () => { ... })
  )
)
```

**Caveat:** Add `concurrency` limits to prevent unbounded parallelism (see #4).

### 4. Add Concurrency Limits

Prevent Inngest from overwhelming Vercel serverless containers with too many parallel steps.

**Pattern:**
```ts
export const monthlyAffiliatePayout = inngest.createFunction(
  {
    id: "monthly-affiliate-payout",
    concurrency: {
      key: "event.data.batchId || 'default'",
      limit: 5,
    },
  },
  { cron: "0 0 1 * *" },
  async ({ step }) => { ... }
)
```

For system-wide limits on event-triggered functions:
```ts
concurrency: [
  { limit: 5, key: "event.data.affiliateId" },  // per-affiliate cap
  { limit: 50 },                                   // global cap
]
```

### 5. Add Throttling for High-Frequency Event Sources

Functions triggered by user actions (like `sendEmail`) should throttle to prevent bursts.

**Pattern:**
```ts
export const sendEmail = inngest.createFunction(
  {
    id: "send-email",
    throttle: {
      key: "event.data.to",
      limit: 10,
      period: "1m",
    },
  },
  { event: "email/send" },
  async ({ event, step }) => { ... }
)
```

### 6. Consider `batchEvents` for High-Volume Functions

For `sendEmail` or broadcast emails, processing events in batches reduces per-invocation overhead.

**Pattern:**
```ts
export const sendEmail = inngest.createFunction(
  {
    id: "send-email",
    batchEvents: {
      maxSize: 20,
      timeout: "5s",
    },
  },
  { event: "email/send" },
  async ({ events, step }) => {
    await step.run("bulk-send", async () => {
      return Promise.all(
        events.map((e) => resend.emails.send({ ... }))
      )
    })
  }
)
```

### 7. Move Heavy Work Out of Inngest

Current: `renderToBuffer` (PDF generation) runs in the PayUnit webhook, creating a large base64 payload sent to Inngest.

**Recommendation:** Generate PDFs asynchronously in a separate step or skip PDF attachment for email and instead provide a download link. This reduces event payload size and CPU inside Inngest.

### 8. Reduce Retry Overhead

`immediateAffiliatePayout` has `retries: 3`. With idempotency keys added, retries are safe but still consume CPU. Consider:
- `retries: 1` for functions with external side effects (emails, notifications) — the work is idempotent so one retry is enough
- Keep `retries: 3` only for critical financial transactions where transient failures must be retried

---

## Implementation Order

1. **Event-level idempotency keys** — highest impact, lowest risk. Prevents duplicate runs immediately.
2. **Function-level idempotency** — on `immediateAffiliatePayout` and `sendEmail`.
3. **Parallelize fan-out loops** — `monthlyAffiliatePayout`, `installmentDeadlineCheck`, `lowStockAlertCheck`, `sendBroadcast`.
4. **Concurrency limits** — add to all event-triggered functions and high-volume cron functions.
5. **Throttling** — on `sendEmail`.
6. **Move PDF generation out of webhook** — medium effort, reduces payload size.
7. **Adjust retry counts** — final tuning.

---

## Validation

1. Deploy to staging with Inngest dev/prod branch
2. Use Inngest dashboard to verify:
   - No duplicate function runs for same event ID
   - Parallel steps appear in timeline as concurrent
   - Concurrency limits prevent queue flooding
3. Monitor Vercel Analytics → Fluid CPU usage before/after
4. Check Inngest function run duration metrics — expect 30-60% reduction for fan-out functions

---

## Out of Scope

- Migrating to Inngest queues (no current queue usage)
- Changing database schema
- Adding caching layers (Redis already available but not Inngest-related)
