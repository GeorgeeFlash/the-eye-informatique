# Systemic Fixes for Admin Product Management & Affiliate/Admin Product Share Feature

## Completion State Audit

| Component | Status | Notes |
|-----------|--------|-------|
| `product.schema.ts` | Partial | `variant.id` optional exists; slug URL-safe validation missing |
| `product.actions.ts` | Mostly done | Variant reconciliation + safe deletion done; `getProducts` filters done |
| `affiliate.actions.ts` | Done | `getOrCreateProductAffiliateLink` exists |
| `image-uploader.tsx` | Done | Reorder, alt-text popover, 5MB/MIME validation exist |
| `product-share-dialog.tsx` | Done | Full modal with native share, social buttons, pitch copy, affiliate badge |
| `product-form.tsx` | Partial | Category select bug, featureValues cleanup, regenerate slug, header actions missing |
| `product-form-wrapper.tsx` | Partial | Feature field sync done; featureValues cleanup on category change missing |
| `product-list-client.tsx` | Partial | No status/stock filters, no archive dialog, no share/view actions, no toasts |
| `admin/[id]/page.tsx` | Partial | Share/storefront header buttons missing |
| `product-details.tsx` | Partial | Share button missing |
| `affiliate/links/page.tsx` | Partial | Quick share action missing |
| `en.json` / `fr.json` | Mostly done | productShare keys exist; some productAdmin filter/confirm strings exist |

## Execution Order

### Phase 1: Schema & Validation (Backend)

#### Task 1.1: Enhance slug validation in `product.schema.ts`
- Add `.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)` to `slug` field in `productSchemaBase` to enforce lowercase URL-safe slugs with hyphens only.
- Verify `createProduct` and `updateProduct` already call `slugify()` on creation.

**File:** `lib/validators/product.schema.ts`
**Risk:** Low — additive validation only.

---

### Phase 2: Form Fixes & Header Actions (Dashboard)

#### Task 2.1: Fix category select controlled binding in `product-form.tsx`
- Replace `defaultValue={field.value}` with `value={field.value}` on the `<Select>` component (line ~307). The current `defaultValue` makes it uncontrolled after initial render, causing stale state when editing.
- Same fix for the commission type select (line ~379) and branch select (line ~740) if applicable.

**File:** `components/dashboard/product-form.tsx`
**Risk:** Medium — uncontrolled→controlled can surface re-render bugs; verify form still initializes correctly.

#### Task 2.2: Clean mismatched `featureValues` on category change
- In `product-form.tsx`, inside the `useEffect` that calls `onCategoryChange`, also reset `featureValues` to `[]` when `watchCategoryId` changes to a new value.
- Alternatively, have `ProductFormWrapper` clean state before loading new fields: reset `featureValues` in the wrapper's `handleCategoryChange` callback.

**Files:** `components/dashboard/product-form.tsx`, `components/dashboard/product-form-wrapper.tsx`
**Risk:** Low — prevents orphaned feature values.

#### Task 2.3: Client-side validation for required dynamic feature fields
- Before submitting in `onSubmit`, iterate over `featureFields` and check any field with `isRequired: true` has a non-empty value in `featureValues`.
- Set form errors on the relevant feature field if missing, or append to `serverError`.
- This is defensive; backend already validates, but client-side gives instant feedback.

**File:** `components/dashboard/product-form.tsx`
**Risk:** Low — additive client check.

#### Task 2.4: Add "Regenerate Slug" button
- Add a small button/icon next to the slug input that calls `slugify(form.getValues("name"))` and sets the slug value.
- Place it inside the slug `FormItem` next to the input.

**File:** `components/dashboard/product-form.tsx`
**Risk:** Low — UI only.

#### Task 2.5: Include variant `id` in form state for editing
- In `page.tsx` (admin product editor), when mapping `product.variants` to `defaultValues`, include `id: v.id` in each variant object.
- The `productVariantSchema` already allows optional `id`, so no schema change needed.
- This ensures the backend's `updateProduct` can match incoming variants by `id` and correctly reconcile (upsert vs create vs remove).

**File:** `app/[locale]/(dashboard)/admin/(admin)/products/[id]/page.tsx`
**Risk:** Medium — without this, editing a product creates duplicate variants instead of updating existing ones.

#### Task 2.6: Add "View on Store" and "Share" header buttons when editing
- In `page.tsx`, import `ProductShareDialog` and add a header row above the form wrapper with:
  - A link button to `/products/${product.slug}` (open in new tab) labeled "View on Storefront".
  - A `ProductShareDialog` trigger button labeled "Share".
- Pass the product data needed by `ProductShareDialog` (id, name, slug, description, basePrice, brand, categoryName, imageUrl, condition).

**Files:** `app/[locale]/(dashboard)/admin/(admin)/products/[id]/page.tsx`
**Risk:** Low — UI integration only.

---

### Phase 3: Product List Enhancements (Dashboard)

#### Task 3.1: Add Status and Stock filters to `product-list-client.tsx`
- Add two `<Select>` dropdowns in the toolbar:
  - **Status:** All / Active / Archived → maps to `isActive` query param
  - **Stock:** All / In Stock / Low Stock / Out of Stock → maps to `stockStatus` query param
- Read initial values from `searchParams` via `useSearchParams`.

**File:** `app/[locale]/(dashboard)/admin/(admin)/products/product-list-client.tsx`
**Risk:** Low — `getProducts` already supports these params.

#### Task 3.2: Add archive confirmation `AlertDialog`
- Replace the direct `onClick` on the archive `DropdownMenuItem` with an `AlertDialog` state.
- On confirm, call `deleteProduct(id)` and show a toast.

**File:** `app/[locale]/(dashboard)/admin/(admin)/products/product-list-client.tsx`
**Risk:** Low — UX improvement.

#### Task 3.3: Add "Share Product" and "View in Store" row actions
- Add two new `DropdownMenuItem`s to the actions dropdown:
  - **View in Store:** `<Link href={`/products/${row.original.slug}`} target="_blank">` 
  - **Share Product:** Opens `ProductShareDialog` with the row's product data. Since this is a client component, wrap it in a state-controlled dialog.

**File:** `app/[locale]/(dashboard)/admin/(admin)/products/product-list-client.tsx`
**Risk:** Medium — requires passing product data to client dialog; ensure `ProductRow` type has all needed fields (slug, description, basePrice, brand, category, images, condition).

#### Task 3.4: Add toast feedback on mutations
- Import `toast` from `sonner`.
- In `handleDelete`, wrap the action and call `toast.success(t("archiveSuccess"))` or `toast.error(...)` on failure.
- If table mutations are triggered via server actions elsewhere, ensure callers show toasts.

**File:** `app/[locale]/(dashboard)/admin/(admin)/products/product-list-client.tsx`
**Risk:** Low.

---

### Phase 4: Storefront & Affiliate Share Integration

#### Task 4.1: Add Share button to `product-details.tsx`
- Import `ProductShareDialog`.
- Add a button near the product title or action area that opens the share dialog.
- Pass the product data (id, name, slug, description, basePrice, brand, categoryName, imageUrl, condition) to the dialog.
- Condition: for storefront, we don't have the full `condition` on the product level (it's on variants). Use the selected variant's condition or default to `NEW`.

**File:** `components/storefront/product-details.tsx`
**Risk:** Low.

#### Task 4.2: Add quick share action to affiliate links page
- In `app/[locale]/(dashboard)/dashboard/(affiliate)/links/page.tsx`, add a "Share" button per row that opens `ProductShareDialog` or a simplified share action.
- Since the link table only has `targetUrl`, construct a minimal `ShareableProduct` from the URL (extract slug) or fetch product data.
- Simplest approach: add a `ShareLinkButton` client component that takes `targetUrl` and calls `navigator.share` / clipboard.

**File:** `app/[locale]/(dashboard)/dashboard/(affiliate)/links/page.tsx`
**Risk:** Low — may require a new small client component.

---

### Phase 5: Tests & Verification

#### Task 5.1: Unit tests for product validators
- Create `tests/unit/lib/validators/product.schema.test.ts`
- Test cases:
  - Valid product creation data passes `createProductInput`
  - Invalid slug (uppercase, special chars) fails `productSchemaBase`
  - Variant with optional `id` passes `productVariantSchema`
  - Commission > 100% fails
  - Missing commission value when type selected fails

#### Task 5.2: Unit tests for product actions (mocked DB)
- Create `tests/unit/actions/product.actions.test.ts`
- Mock `db`, `requireRole`, `revalidatePath`.
- Test cases:
  - `updateProduct` with variant `id` present updates existing variant
  - `updateProduct` with removed variant (no orders) deletes variant
  - `updateProduct` with removed variant (has orders) zeros stock instead of deleting
  - `getProducts` with `stockStatus="out_of_stock"` returns correct products
  - `getProducts` with `isActive=false` returns archived products

#### Task 5.3: Run verification
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`

---

## Data Flow Diagrams

### Variant Reconciliation on Edit
```
Form submits variants: [{id: "v1", sku: "A"}, {sku: "B"}]
    ↓
updateProduct action
    ↓
Fetch existing variants for product
    ↓
Match by id:
  - v1 (id matches) → UPDATE
  - B (no id) → CREATE new
    ↓
Removed variants (existing but not in incoming):
  - Check orderItem.count
  - If 0 → DELETE variant + stockByBranch
  - If >0 → UPDATE stock=0, stockByBranch stock=0
```

### Affiliate Share Link Resolution
```
User opens Share dialog
    ↓
Dialog calls getOrCreateProductAffiliateLink(slug)
    ↓
Server checks: is user approved affiliate?
  - YES → find/create affiliateLink with targetUrl="/products/{slug}"
  - Return { isAffiliate: true, url: "/ref/{code}" }
  - NO → return { isAffiliate: false, url: "/products/{slug}" }
    ↓
Dialog displays appropriate link + badge
```

## Edge Cases & Mitigations

| Edge Case | Mitigation |
|-----------|-----------|
| Variant edit without `id` in form state | Task 2.5 ensures `id` is included in defaultValues |
| Category switch loses existing feature values | Task 2.2 explicitly resets `featureValues` on category change |
| Archive product with existing orders | `deleteProduct` already soft-deletes (`isActive=false`); AlertDialog prevents accidents |
| Share dialog for product with no image | `product-share-dialog.tsx` already has fallback placeholder |
| Affiliate link race condition (duplicate codes) | `getOrCreateProductAffiliateLink` uses deterministic slug + random suffix; DB has unique constraint on `code` |
| Stock filter conflicts with branch scoping | `getProducts` handles branch scoping + stock filters in existing logic |
| Client-side required feature validation bypass | Backend in `createProduct`/`updateProduct` already validates required fields |

## Open Questions / Decisions

1. **LinkedIn share button:** The plan mentions LinkedIn but `product-share-dialog.tsx` doesn't include it. Decision: out of scope for this plan — can be added later.
2. **Drag-and-drop for images:** Plan mentions drag reordering; current implementation only has Move Left/Right buttons. Decision: out of scope — buttons are sufficient MVP.
3. **WhatsApp bold formatting:** Plan mentions bold tags. Current implementation uses `*bold*` which WhatsApp renders correctly. Decision: keep as-is.

## Validation Checklist

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (existing + new unit tests)
- [ ] `pnpm lint` passes
- [ ] Product edit preserves variant `id` and updates correctly
- [ ] Removing a variant with past orders zeros stock instead of deleting
- [ ] Removing a variant without orders deletes cleanly
- [ ] Category switch clears mismatched featureValues
- [ ] Required feature fields block submission if empty
- [ ] Regenerate slug button produces valid slug
- [ ] Status filter (Active/Archived) works in product table
- [ ] Stock filter (In Stock/Low Stock/Out of Stock) works in product table
- [ ] Archive confirmation dialog appears before soft-delete
- [ ] Share button works from admin product editor
- [ ] Share button works from storefront product page
- [ ] Affiliate sees tracked link; admin sees direct storefront link
- [ ] WhatsApp, Facebook, Telegram, Email, Native Share, Copy Pitch all function
