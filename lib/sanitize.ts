const TAG_ALLOWLIST = new Set([
  "b", "i", "u", "em", "strong", "p", "br", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre",
  "a", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
])

const ATTR_ALLOWLIST: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  span: new Set(["class"]),
  div: new Set(["class"]),
  code: new Set(["class"]),
  pre: new Set(["class"]),
}

/**
 * Strip all HTML tags, returning only the text content.
 * Use this for fields that should never contain markup (names, titles, etc.)
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim()
}

/**
 * Sanitize a plain-text string for safe display by escaping HTML entities.
 * Use this for user-submitted text that will be rendered in HTML context.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

/**
 * Sanitize rich text HTML by removing dangerous tags and attributes.
 * Allows a safe subset of formatting tags while stripping scripts,
 * event handlers, and dangerous protocols.
 */
export function sanitizeHtml(input: string): string {
  // Remove script/style/iframe tags and their contents entirely
  let cleaned = input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")

  // Remove event handlers (on*)
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "")

  // Remove dangerous URL protocols in href/src
  cleaned = cleaned.replace(/(?:href|src)\s*=\s*["']?\s*javascript:/gi, 'href="')
  cleaned = cleaned.replace(/(?:href|src)\s*=\s*["']?\s*data:/gi, 'href="')
  cleaned = cleaned.replace(/(?:href|src)\s*=\s*["']?\s*vbscript:/gi, 'href="')

  // Remove tags not in allowlist (keep their text content)
  cleaned = cleaned.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
    const lowerTag = tag.toLowerCase()
    if (!TAG_ALLOWLIST.has(lowerTag)) return ""

    // For allowed tags, strip attributes not in allowlist
    if (match.startsWith("</")) return `</${lowerTag}>`

    const allowedAttrs = ATTR_ALLOWLIST[lowerTag]
    if (!allowedAttrs) {
      // No attributes allowed for this tag
      return match.endsWith("/>") ? `<${lowerTag} />` : `<${lowerTag}>`
    }

    // Extract and filter attributes
    const attrRegex = /\s+([a-zA-Z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g
    let attrs = ""
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrRegex.exec(match)) !== null) {
      const attrName = attrMatch[1].toLowerCase()
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? ""
      if (allowedAttrs.has(attrName)) {
        attrs += ` ${attrName}="${escapeHtml(attrValue)}"`
      }
    }

    return match.endsWith("/>") ? `<${lowerTag}${attrs} />` : `<${lowerTag}${attrs}>`
  })

  return cleaned.trim()
}
