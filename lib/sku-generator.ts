export function generateSkuFromTemplate(
  template: string,
  context: {
    productSlug: string
    productId: string
    categorySlug: string
    axisValues: Record<string, string>
  },
): string {
  const MAX_SKU_LENGTH = 80
  const DELIMITER = "-"

  const reserved: Record<string, string> = {
    product_slug: sanitize(context.productSlug),
    product_id: sanitize(context.productId),
    category_slug: sanitize(context.categorySlug),
  }

  let sku = template

  for (const [key, value] of Object.entries(reserved)) {
    sku = sku.replaceAll(`{${key}}`, value)
  }

  for (const [axisName, axisValue] of Object.entries(context.axisValues)) {
    sku = sku.replaceAll(`{${axisName}}`, sanitize(axisValue))
  }

  sku = sku.replaceAll(/\{[^}]+\}/g, "")

  sku = sku.replaceAll(/[^a-zA-Z0-9-]+/g, DELIMITER)

  sku = sku.replaceAll(/[-]{2,}/g, DELIMITER)

  sku = sku.replace(/^[-]+|[-]+$/g, "")

  if (sku.length > MAX_SKU_LENGTH) {
    sku = sku.slice(0, MAX_SKU_LENGTH).replace(/[-]+$/g, "")
  }

  return sku || sanitize(context.productSlug)
}

function sanitize(value: string): string {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
