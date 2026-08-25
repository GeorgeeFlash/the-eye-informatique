# Category Variant Management — Implementation Plan

## 1. UI/UX: Sidebar & Navigation

**File:** `components/dashboard/sidebar/app-sidebar.tsx`

Add a new sub-item under the `commerce` group in `operationsNav`:

```tsx
{
  title: t("variants"),
  url: "/admin/variants",
  match: "prefix",
}
```

**i18n keys to add** (`messages/en.json` + `messages/fr.json` under `sidebar.admin`):
- `variants`: "Variants" / "Variantes"

**New routes:**
- `/admin/variants` — category-scoped variant axis dashboard
- `/admin/categories/[id]` — updated category edit page with Variant Axes section + SKU template with live preview

**Category Edit Page integration** (`app/[locale]/(dashboard)/admin/(admin)/categories/[id]/category-edit-client.tsx`):
- Add a new `<Card>` below the Feature Fields card titled "Variant Axes".
- CRUD for `CategoryVariantAxis` and its `CategoryVariantAxisValue` children.
- Each axis shows name, sort order, values count; actions: add value, edit axis, delete axis.
- **SKU Template** field with **live preview**: as the admin types the template and has at least one axis with values, a preview box shows an example generated SKU for a sample product slug. Updates reactively.

---

## 2. Data Architecture

### Problem
The current `CategoryFeatureField` model stores single-value product specs (e.g., "RAM: 16GB"). The existing `ProductVariant` model stores SKU-level commerce data (price, stock, SKU). There is no category-level mechanism to define **variant axes** (e.g., RAM, Storage, Processor) that can generate multiple SKUs as a cartesian product, with per-axis price deltas and automatic SKU generation.

### Proposed Schema (Prisma)

Add three new models to `prisma/schema.prisma`:

```prisma
model ProductVariant {
  // ... existing fields ...
  options ProductVariantOption[]
}

model CategoryVariantAxis {
  id        String                 @id @default(cuid())
  categoryId String
  name      String
  sortOrder Int                    @default(0)
  category  Category               @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  values    CategoryVariantAxisValue[]

  @@index([categoryId])
}

model CategoryVariantAxisValue {
  id        String                 @id @default(cuid())
  axisId    String
  value     String
  sortOrder Int                    @default(0)
  priceDelta Decimal?              @db.Decimal(10, 2) @default(0)
  axis      CategoryVariantAxis    @relation(fields: [axisId], references: [id], onDelete: Cascade)
  options   ProductVariantOption[]

  @@index([axisId])
}

model ProductVariantOption {
  id          String                @id @default(cuid())
  variantId   String
  axisValueId String
  axisValue   CategoryVariantAxisValue @relation(fields: [axisValueId], references: [id], onDelete: Cascade)
  variant     ProductVariant        @relation(fields: [variantId], references: [id], onDelete: Cascade)

  @@unique([variantId, axisValueId])
  @@index([variantId])
  @@index([axisValueId])
}
```

Update `Category` model:

```prisma
model Category {
  // ... existing fields ...
  variantAxes CategoryVariantAxis[]
  skuTemplate String?
}
```

### Key Design Decisions
- **Reverse relations on ProductVariant and CategoryVariantAxisValue**: Added `options` arrays to enable efficient nested includes when querying variants for the storefront and admin matrix.
- **priceDelta on axis values**: Each value can carry a price modifier (positive or negative). E.g., `16GB` RAM = +10,000 XAF, `512GB SSD` = +15,000 XAF.
- **SKU Template on Category**: Optional string that defines auto-SKU format using placeholders like `{product_slug}`, `{RAM}`, `{Storage}`.

### SKU Template Syntax
- Placeholders wrapped in `{}`: reserved keywords (`product_slug`, `product_id`, `category_slug`) or axis names (`RAM`, `Storage`).
- Example: `{product_slug}-{RAM}-{Storage}` → `dell-latitude-5400-16gb-512gb`.
- If no template: manual entry only.

### Price Calculation
1. **Variant price** = `basePrice + sum(priceDelta for each selected axis value)`.
2. **First variant** (first combination in sort order) is the **default display variant**. Its computed price is synced to the product's `basePrice` so the storefront shows a consistent "from" price.
3. Admins can override any variant's price inline; the override replaces the computed value.

### Variant Generation Strategy
- **Product creation with axes**: v1 does NOT support generating variants during initial product creation. Admin creates the product first, then redirects to the edit page to generate the matrix. This avoids two-phase creation complexity.
- **Product edit with axes**: Admin clicks **"Generate Matrix"** which:
  1. Deletes ALL existing variants for the product (and their `ProductVariantOption` records cascade).
  2. Computes cartesian product of all axis values.
  3. Creates `ProductVariant` rows with computed prices and SKUs.
  4. Creates `ProductVariantOption` records.
  5. Syncs first variant's price to product's `basePrice`.
- **Combinatorial cap**: Hard limit of 200 variants per product. Reject with clear error if exceeded.
- **Transaction safety**: Entire generation runs in a Prisma `$transaction`. Partial failure rolls back everything.

---

## 3. Frontend Implementation

### A. Category Edit Page — Variant Axes + SKU Template
**File:** `app/[locale]/(dashboard)/admin/(admin)/categories/[id]/category-edit-client.tsx`

Add a new `<Card>` below the Feature Fields card.

**State:**
- `axes`, `axisDialogOpen`, `editingAxis`, `valueDialogOpen`, `editingValue`
- `skuTemplate`: string (bound to category form)
- `previewSlug`: string (sample slug for live preview, default `"sample-product"`)

**Axis CRUD**: Dialog for name + sortOrder. Inline list with values count + actions.
**Value CRUD**: Fields for `value`, `sortOrder`, `priceDelta`. Prevent duplicates.
**SKU Template**: Text input with helper text. **Live preview box** below it that calls `generateSkuFromTemplate` client-side (same logic as backend) using the first axis's first value and `previewSlug`.

### B. Product Edit Page — Variant Matrix
**Files:**
- `app/[locale]/(dashboard)/admin/(admin)/products/[id]/page.tsx` — fetch variant axes + category skuTemplate
- `components/dashboard/product-form-wrapper.tsx` — accept and fetch variant axes on category change
- `components/dashboard/product-form.tsx` — render matrix when axes exist

**Behavior:**
1. When the product's category has variant axes, **replace** the simple "Add Variant" list with a **Variant Matrix** section.
2. Show current variants in a table grouped by axis values.
3. **Mode toggle**: "Auto-generate SKUs" (default if template exists) / "Manual entry".
4. **"Generate Matrix" button**: Calls `generateVariantsFromAxes` server action. Shows confirmation dialog: "This will replace all existing variants." After success, page refreshes to show the matrix.
5. **Inline editing**: SKU, price, stock per variant row.
6. **Delete variant**: Removes variant (and cascade-deletes its options).
7. After editing, normal "Save Product" submit updates variant properties via existing `updateProduct` action. `ProductVariantOption` records remain untouched.

### C. Admin Variants Dashboard
**Route:** `/admin/variants`
**File:** `app/[locale]/(dashboard)/admin/(admin)/variants/page.tsx`

- Read-only table: Category | Axis | Values Count | Products Count | SKU Template
- Click-through to category edit.
- Quick stats cards.

### D. Storefront Product Page Update
**Files:**
- `actions/product.actions.ts` — `getProduct` and `getProductBySlug` must include variant options + category axes
- `app/[locale]/(storefront)/products/[productSlug]/page.tsx` — serialize variant options
- `components/storefront/product-details.tsx` — render axis-based selectors when variants have options

**Storefront logic:**
1. If product has >1 variant AND variants have `options` (axis values), render axis-based dropdowns grouped by axis name.
2. If product has >1 variant but NO options (legacy variants), keep existing condition/color selector.
3. If product has 1 variant, show its price directly (no selector needed).

---

## 4. Backend / API Requirements

### New Zod Validators
**File:** `lib/validators/variant-axis.schema.ts`

```ts
export const variantAxisSchema = z.object({
  name: z.string().min(1).max(50),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})

export const axisValueSchema = z.object({
  value: z.string().min(1).max(50),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  priceDelta: z.coerce.number().default(0),
})

export const skuTemplateSchema = z.string().max(200).optional()
```

### Server Actions
**New file:** `actions/variant-axis.actions.ts`

| Action | Signature | Description |
|--------|-----------|-------------|
| `createVariantAxis` | `(categoryId: string, data: { name: string, sortOrder?: number })` | Create axis. CENTRAL_ADMIN only. |
| `updateVariantAxis` | `(id: string, data: { name?: string, sortOrder?: number })` | Update axis. CENTRAL_ADMIN only. |
| `deleteVariantAxis` | `(id: string)` | Delete axis + cascade values. Prevent if values in use. CENTRAL_ADMIN only. |
| `createAxisValue` | `(axisId: string, data: { value: string, sortOrder?: number, priceDelta?: number })` | Add value. CENTRAL_ADMIN only. |
| `updateAxisValue` | `(id: string, data: { value?: string, sortOrder?: number, priceDelta?: number })` | Update value. CENTRAL_ADMIN only. |
| `deleteAxisValue` | `(id: string)` | Delete value. Prevent if in use. CENTRAL_ADMIN only. |
| `getVariantAxesByCategory` | `(categoryId: string)` | Return axes with values + category skuTemplate. |
| `generateVariantsFromAxes` | `(productId: string, selectedAxisValueIds: string[][], options: { skuTemplate?: string, autoGenerateSku?: boolean, basePrice: number })` | Delete existing variants, generate new matrix in transaction. STAFF/ADMIN/CENTRAL_ADMIN + product access. |
| `updateCategorySkuTemplate` | `(categoryId: string, skuTemplate: string | null)` | Update template. CENTRAL_ADMIN only. |

### SKU Generation Logic
**New file:** `lib/sku-generator.ts`

```ts
export function generateSkuFromTemplate(template: string, context: {
  productSlug: string
  productId: string
  categorySlug: string
  axisValues: Record<string, string>
}): string
```

Algorithm:
1. Replace reserved placeholders with sanitized values (lowercase, hyphens, alphanumeric only).
2. Replace axis placeholders with sanitized axis values.
3. Strip unresolvable placeholders.
4. Collapse consecutive delimiters.
5. Trim leading/trailing delimiters.
6. Enforce max 80 chars (truncate intelligently).
7. Ensure uniqueness against existing variants for the same product; append `-2`, `-3` on conflict.

### SKU Template Validator
**New file:** `lib/sku-validator.ts`

```ts
export function validateSkuTemplate(template: string, axes: CategoryVariantAxis[]): string | null
```

Returns error string if template references non-existent axis names, or `null` if valid.

### Query Updates
- `getProduct(id)` and `getProductBySlug(slug)` must include:
  - `category.variantAxes` with `values`
  - `variants.options` with `axisValue.axis`
- `getVariantAxesByCategory(categoryId)` — return axes with values + `category.skuTemplate`.
- `getProductVariantOptions(variantId)` — return options with axis value + axis name.
- `getVariantsByAxisValue(axisValueId)` — for admin filtering.

### Activity Logging
Log `VARIANT_AXIS_CREATED`, `VARIANT_AXIS_UPDATED`, `VARIANT_AXIS_DELETED`, `VARIANT_GENERATED`, `SKU_TEMPLATE_UPDATED`.

### Revalidation Paths
After each action, revalidate:
- `/admin/products`
- `/admin/categories`
- `/admin/variants`
- `/products` (storefront)

---

## 5. Systemic Workflow

### End-to-End: Admin Creates Variant Matrix for a Laptop Category

**Step 1 — Define Category Axes & SKU Template**
1. Admin: **Commerce → Categories → Edit "Laptops"**.
2. In **Variant Axes** section:
   - Add axis `RAM` → values: `8GB` (Δ0), `16GB` (Δ10,000), `32GB` (Δ25,000).
   - Add axis `Storage` → values: `256GB SSD` (Δ0), `512GB SSD` (Δ15,000), `1TB SSD` (Δ35,000).
   - Add axis `Processor` → values: `i5` (Δ0), `i7` (Δ20,000), `i9` (Δ45,000).
3. Enter SKU Template: `{product_slug}-{RAM}-{Storage}-{Processor}`.
4. Live preview shows: `sample-product-8gb-256gb-ssd-i5`.

**Step 2 — Create Product**
1. Admin: **Commerce → Products → Add Product**.
2. Select category **"Laptops"**.
3. Enter name: "Dell Latitude 5400", base price: `100000 XAF`.
4. Product form detects axes. Simple variant list is replaced by **Variant Matrix** section with message: "Define variant axes for this category first, then generate variants."
5. Admin clicks **"Create Product"**.
6. System creates product, redirects to edit page.

**Step 3 — Generate Variant Matrix**
1. On edit page, admin scrolls to **Variant Matrix**.
2. Mode: **Auto-generate SKUs** (default).
3. Clicks **"Generate Matrix"**. Confirmation dialog: "This will replace all existing variants."
4. System computes 27 combinations. Prices: base 100,000 + sum of deltas.
5. Admin reviews, overrides prices/stock inline.
6. Clicks **"Save Product"**.
7. System creates 27 `ProductVariant` + 81 `ProductVariantOption` rows. First variant's price (100,000 XAF) syncs to `basePrice`.

**Step 4 — Storefront**
1. Customer opens Dell Latitude 5400.
2. Frontend sees variants have `options` → renders RAM, Storage, Processor dropdowns.
3. Customer selects `16GB` + `512GB SSD` + `i7` → price `145,000 XAF`.
4. Adds to cart.

**Step 5 — Inventory Updates**
1. Admin updates stock for specific variants.
2. Storefront disables out-of-stock combinations.

---

## 6. Migration & Rollout

1. **Prisma migration**: `npx prisma migrate dev --name add-variant-axes`
2. **Seed data**: No changes required.
3. **Backward compatibility**: Products without axes behave exactly as before. `ProductVariantOption` is only populated for matrix-generated variants.
4. **Gradual rollout**: Axes and SKU templates are optional per category.
5. **Storefront compatibility**: Products without options keep existing condition/color selector. Products with options get axis-based selectors.

---

## 7. Validation Plan

- **Unit tests**: Zod schemas; cartesian product generator; cap enforcement; SKU generator; SKU template validator; price delta arithmetic.
- **Integration tests**: Create axis → add values with price deltas → set SKU template → generate variants → verify `ProductVariantOption` records, SKU format, price calculation, and `basePrice` sync.
- **Edge cases**:
  - 0 axes → simple variant list.
  - 1 axis → single-dimensional variants.
  - Delete in-use axis value → server error.
  - Edit axis name → options remain valid (reference `axisValueId`).
  - >200 combinations → rejection.
  - Duplicate SKUs from template → `-2`, `-3` suffixes.
  - Unresolvable placeholders → stripped.
  - Template >80 chars → truncated.
  - Auto→manual mode switch → existing SKUs preserved.
  - Negative priceDelta → cheaper variant.
  - Transaction failure → no partial data.
  - Regenerate matrix → replaces all variants (cascade delete options).
  - Live SKU preview updates reactively.
  - Template validation catches mismatched axis names before save.
  - Storefront: products with options show axis selectors; products without options show legacy selector.

---

## 8. Code Quality & Architecture Guardrails

- **Follow existing patterns**: Server actions in `actions/`, validators in `lib/validators/`, Prisma includes in action queries.
- **No new client-side data fetching**: Variant axes are fetched server-side and passed as props, matching the existing `featureFields` pattern.
- **Transaction boundaries**: All multi-step writes (variant generation) use `db.$transaction`.
- **Cascade safety**: `onDelete: Cascade` on `ProductVariantOption` → `CategoryVariantAxisValue` → `CategoryVariantAxis` ensures no orphan records.
- **Unique constraints**: `ProductVariant.sku` remains `@unique`. `ProductVariantOption` has `@@unique([variantId, axisValueId])`.
- **Indexing**: `@@index` on foreign keys (`categoryId`, `axisId`, `variantId`, `axisValueId`) for query performance.
- **Revalidation consistency**: Use `revalidatePath` for admin routes; `revalidateProducts()` covers `/admin/products` and `/products`.
- **Type safety**: All server action inputs/outputs use Zod-validated types. No `any` in new code.

---

## 9. Open Questions / Out of Scope

- **Variant images**: Not in v1. Add `imageUrl` to `ProductVariant` later if per-combination images are needed.
- **Bulk variant import/export**: Out of scope.
- **Multi-category products**: Axes scoped to single `categoryId`. Redesign needed later.
- **Price display on storefront**: v1 shows first variant's price as "from" price. Price ranges are a later UX enhancement.
- **Variant option search/filter on storefront**: Not in v1. Axes enable this in the future.
- **Two-phase product creation for matrix products**: v1 requires creating the product first, then generating variants on the edit page. A unified create+generate flow is a future enhancement.
