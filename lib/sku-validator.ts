export function validateSkuTemplate(
  template: string,
  _axes: { name: string }[],
): string | null {
  if (!template || template.trim().length === 0) {
    return null
  }

  const placeholders = template.match(/\{([^}]+)\}/g)
  if (!placeholders) {
    return null
  }

  const axisNames = new Set(_axes.map((a) => a.name))
  const reserved = new Set(["product_slug", "product_id", "category_slug"])

  for (const raw of placeholders) {
    const name = raw.slice(1, -1)
    if (reserved.has(name)) continue
    if (!axisNames.has(name)) {
      return `Template references unknown axis "${name}".`
    }
  }

  return null
}
