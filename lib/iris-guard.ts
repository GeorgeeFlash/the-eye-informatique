import type { UIMessage } from "ai"

/** Hard cap for a single customer message. */
export const IRIS_MAX_MESSAGE_CHARS = 500

/** How much prior conversation is forwarded to the model. */
const IRIS_MAX_MESSAGES = 12
const IRIS_MAX_ASSISTANT_CHARS = 1_500
const IRIS_MAX_TOTAL_CHARS = 6_000

export type IrisGuardError = "invalid_request" | "message_too_long"

export type IrisGuardResult =
  | { ok: true; messages: UIMessage[] }
  | { ok: false; error: IrisGuardError }

/**
 * Keep only recent user and assistant text. Drops system messages, tool
 * payloads, and anything else a client could inject into the model context.
 */
export function guardIrisMessages(input: unknown): IrisGuardResult {
  if (!Array.isArray(input) || input.length === 0 || input.length > 100) {
    return { ok: false, error: "invalid_request" }
  }

  const messages: UIMessage[] = []
  let total = 0

  for (const raw of input.slice(-IRIS_MAX_MESSAGES)) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "invalid_request" }
    }

    const record = raw as { id?: unknown; role?: unknown; parts?: unknown }
    if (record.role !== "user" && record.role !== "assistant") continue
    if (!Array.isArray(record.parts)) continue

    const textParts: Array<{ type: "text"; text: string }> = []
    for (const part of record.parts.slice(0, 12)) {
      if (!part || typeof part !== "object") continue
      const candidate = part as { type?: unknown; text?: unknown }
      if (candidate.type !== "text" || typeof candidate.text !== "string") continue

      const trimmed = candidate.text.trim()
      if (!trimmed) continue

      if (record.role === "user" && trimmed.length > IRIS_MAX_MESSAGE_CHARS) {
        return { ok: false, error: "message_too_long" }
      }

      const clipped =
        record.role === "user"
          ? trimmed
          : trimmed.slice(0, IRIS_MAX_ASSISTANT_CHARS)
      total += clipped.length
      if (total > IRIS_MAX_TOTAL_CHARS) {
        return { ok: false, error: "message_too_long" }
      }
      textParts.push({ type: "text", text: clipped })
    }

    if (textParts.length === 0) continue

    const id =
      typeof record.id === "string" && record.id.length > 0
        ? record.id.slice(0, 80)
        : `m-${messages.length}`

    messages.push({ id, role: record.role, parts: textParts })
  }

  const last = messages.at(-1)
  if (!last || last.role !== "user") {
    return { ok: false, error: "invalid_request" }
  }

  return { ok: true, messages }
}
