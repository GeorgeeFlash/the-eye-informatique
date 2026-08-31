# Production Seed: Real Laptop Catalog (Features + Variant Axes + Products)

## Goal
Create a new file `prisma/prod-seed.ts` that, in one idempotent run, seeds:
1. **Category feature fields** for `laptops` (and a few more categories admins actually use) extracted from the real laptop listings provided.
2. **Category variant axes** for `laptops` — `RAM` and `Storage` axes, with `priceDelta` calculated from the per-listing price ladders where the math is consistent; otherwise `priceDelta: 0` and tier prices are stored on the variant directly.
3. **Real products**: every laptop from the listing texts, with full `ProductFeatureValue` rows, one `ProductVariant` per (RAM × Storage) price tier, plus `ProductStockByBranch` distribution. One `REFURBISHED` demo variant on the ThinkPad X1 Carbon. A **Buea** branch is added (Bamenda stays the Head Office).

Final product **prices use the post-discount "Hunterman" value** (e.g. `150k` from `~200k~ = 150k`). Crossed-out "referral" prices are **not** stored as a field or in the description — they are internal broadcast pricing for affiliates and irrelevant to the public storefront. The user has confirmed this is acceptable.

Kept separate from `prisma/seed.ts` so a production deploy can opt into rich catalog data without disturbing dev.

## Scope
**In**
- New file `prisma/prod-seed.ts` (no edits to `prisma/seed.ts`).
- Branches: add `Buea` (id `branch-buea`). Yaoundé/Douala/Bamenda already exist in dev seed — guard with `findUnique` + `console.warn` and skip if present (idempotent). Bamenda is the **Head Office**; Yaoundé is **Siège**.
- `CategoryFeatureField` rows for `laptops`, `desktops`, `smartphones-iphone`, `tablets`.
- `CategoryVariantAxis` (`RAM`, `Storage`) + values for `laptops`.
- 13 new `Product` rows (every laptop from the listings, plus 1 extra "Dell Precision 7560" workstation), with slug prefix `prod-`, `ProductFeatureValue`, `ProductVariant`, `ProductVariantOption`, `ProductStockByBranch`.
- npm script `"prisma:seed:prod": "tsx prisma/prod-seed.ts"` in `package.json`.

**Out of scope**
- Schema changes / new migrations.
- Editing `prisma/seed.ts` or any UI files.
- Modelling referral / "Hunterman" prices as a first-class field. We use the post-discount value as the only price.
- Authentic product images. We use `https://placehold.co/...` placeholders; the user will replace them later.

## Context Findings
- Package manager: **pnpm** (`pnpm-lock.yaml` present, no `package-lock.json`/`yarn.lock`). All commands use `pnpm`.
- `prisma/schema.prisma`:
  - `CategoryFeatureField` (L146) — `id`, `categoryId`, `name`, `type FeatureFieldType {TEXT|NUMBER|DROPDOWN}`, `options Json?`, `sortOrder`, `isRequired`.
  - `ProductFeatureValue.value` is always `String`.
  - `CategoryVariantAxis` (L416) — unique on `(categoryId, name)`.
  - `CategoryVariantAxisValue` (L428) — unique on `(axisId, value)`, `priceDelta Decimal? @default(0)`.
  - `ProductVariantOption` (L441) — unique on `(variantId, axisValueId)`.
  - `ProductVariant.sku` `@unique`; `Product.slug` `@unique`.
- `prisma.config.ts` L10: `seed: "tsx prisma/seed.ts"` — `npx prisma db seed` runs the dev seed. For prod, run `pnpm tsx prisma/prod-seed.ts` directly.
- Existing dev branches: `branch-yaounde` (TEI Yaoundé - Siège), `branch-douala` (TEI Douala), `branch-bamenda` (TEI Bamenda - Head Office). **Buea is missing and must be created in `prod-seed.ts`.**
- Existing laptop feature fields (in dev seed): `ff-lap-cpu`, `ff-lap-ram`, `ff-lap-storage`, `ff-lap-display`.
- Latent bug to fix: existing dev seed's `CategoryFeatureField.options` upsert uses `update: {}` which is a no-op on re-run (won't extend the array). The new helper fixes this for prod-seed (and could later be back-ported).

## Updated Decisions
| # | Decision |
|---|---|
| D1 | New file only. `prisma/seed.ts` untouched. |
| D2 | Slug prefix `prod-` for every new product to avoid collisions. |
| D3 | SKU pattern: `PROD-{BRAND}-{MODEL}-{RAM}-{STORAGE}-{CONDITION}` (upper-case, RAM in GB without unit, storage numeric). |
| D4 | No prices or crossed-out text in `description`. Description is a clean list of bullet specs only. |
| D5 | Use the **post-discount** price (the `*value*` after `~old~ =`) as the final selling price. Crossed-out "referral" prices are not stored anywhere. |
| D6 | Currency: `XAF` (no decimals). The "with carton +5k" surcharge for HP ProBook 650 G5 and HP ProBook 640 G4 is folded into the variant price; description omits the note. |
| D7 | Variant axes for `laptops`: `RAM` and `Storage`. `priceDelta` is calculated per axis (see Ordered Tasks §5). If math is inconsistent across listings, fall back to `priceDelta: 0` and store absolute tier prices on each `ProductVariant`. |
| D8 | `mergeOptions` helper for `CategoryFeatureField.options` — unions and de-dupes existing + new arrays. |
| D9 | `isRequired = false` for every field. |
| D10 | Tags: `refurbished` on listings that say "Refurbished" in the title; `promo` on listings with a struck-through price; `best-seller` on listings titled "BEST SELLING" or otherwise flagged; `new-arrival` on listings titled "New Stock". |
| D11 | One primary + one secondary placeholder image per product, color-coded by brand. |
| D12 | One `REFURBISHED` demo variant on the Lenovo ThinkPad X1 Carbon (8/256 tier, price 95000) to demonstrate the `Condition` enum. All other variants default to `NEW`. |
| D13 | Branch stock split for new products: 40% Yaoundé / 30% Douala / 20% Bamenda / 10% Buea. Stock per variant: 5 units total (admin adjusts in real life). |
| D14 | Idempotency: every `upsert` on a unique key. |
| D15 | Branch `Buea` added with id `branch-buea`, name `TEI Buea`, city `Buea`. Bamenda remains the Head Office. |
| D16 | `pnpm tsx prisma/prod-seed.ts` is the run command. |

## Branches (new + existing)
| Id | Name | City | Notes |
|---|---|---|---|
| `branch-yaounde` | TEI Yaoundé - Siège | Yaoundé | pre-existing (findUnique guard) |
| `branch-douala` | TEI Douala | Douala | pre-existing (findUnique guard) |
| `branch-bamenda` | TEI Bamenda - Head Office | Bamenda | pre-existing (findUnique guard) |
| `branch-buea` | TEI Buea | Buea | **new, create in prod-seed** |

## Recurring Attributes Extracted From the Listings
| Attribute | Type | Sample |
|---|---|---|
| Processor (full model string) | TEXT | "Intel Core i5-1045G7" |
| Generation | DROPDOWN | ["5th","6th","7th","8th","10th","11th","Ryzen (AMD)"] |
| Base Clock | TEXT | "1.80 GHz" |
| Turbo Boost | TEXT | "up to 4.20 GHz" |
| Cores | DROPDOWN | ["2","4","6","8"] |
| Display Size | TEXT | "14.0\"" |
| Display Resolution | DROPDOWN | ["HD 1366x768","FHD 1920x1080"] |
| Graphics | TEXT | "Intel Iris Xe Graphics" |
| Dedicated VRAM | DROPDOWN | ["128MB","512MB","1GB","2GB","4GB"] |
| RAM Size (variant axis) | DROPDOWN | ["4GB","8GB","16GB","32GB","64GB"] |
| RAM Type | DROPDOWN | ["DDR3","DDR3L","DDR4"] |
| RAM Max (Upgradeable) | DROPDOWN | ["8GB","16GB","32GB","64GB"] |
| Storage Type | DROPDOWN | ["HDD","SSD","HDD + SSD","NVMe"] |
| Storage Capacity (variant axis) | DROPDOWN | ["64GB","128GB","256GB","500GB","512GB","1TB","2TB","8TB"] |
| Storage Max (Upgradeable) | DROPDOWN | ["512GB","1TB","2TB","8TB"] |
| Backlit Keyboard | DROPDOWN | ["Yes","No"] |
| Operating System | DROPDOWN | ["Windows 10 Pro","Windows 11 Pro","Linux-ready"] |
| Wi-Fi | DROPDOWN | ["Wi-Fi 5","Wi-Fi 6"] |
| Bluetooth | DROPDOWN | ["Yes","No"] |
| Webcam | DROPDOWN | ["Yes","HD","No"] |
| Fingerprint Sensor | DROPDOWN | ["Yes","No"] |
| Numeric Keypad | DROPDOWN | ["Yes","No"] |
| Touchscreen | DROPDOWN | ["Yes","No"] |
| Convertible / 2-in-1 | DROPDOWN | ["Yes","No"] |
| Ports (free text) | TEXT | "1× USB-C, 2× USB-A, HDMI, RJ-45" |
| Battery Life | TEXT | "Approx. 4 hours" |
| Weight | TEXT | "1.24 kg" |
| Ideal For | TEXT | "Business, Programming, Students" |
| Color | TEXT | "Black / Silver" |

## Product Data Table (price = post-discount, XAF)
| # | Slug | Brand | Model | Base RAM/Storage | Variants (RAM × Storage → price) | Tags |
|---|---|---|---|---|---|---|
| 1 | `prod-lenovo-thinkpad-x1-carbon-i5-7th` | Lenovo | ThinkPad X1 Carbon (i5 7th) | 8/256 SSD | 8/256→125000, 8/512→145000, +REFURBISHED 8/256→95000 | `best-seller`, `refurbished` |
| 2 | `prod-dell-latitude-5310-i5-10th` | Dell | Latitude 5310 (i5 10th) | 16/256 SSD | 16/256→150000, 16/512→170000, 16/1TB→200000, 32/512→200000, 32/1TB→230000 | `new-arrival`, `promo` |
| 3 | `prod-dell-latitude-5300-x360-i7-8th` | Dell | Latitude 5300 x360 (i7 8th) | 8/256 SSD | 8/256→150000, 16/256→165000, 16/512→190000 | — |
| 4 | `prod-hp-laptop-14-i5-11th` | HP | Laptop 14 (i5 11th) | 16/256 SSD | 16/256→150000, 16/512→170000 *(second tier renamed; see Decisions §2 from prior round)* | `new-arrival` |
| 5 | `prod-dell-latitude-5480-i7-7th` | Dell | Latitude 5480 (i7 7th; covers 7480) | 8/256 SSD | 8/256→130000, 16/256→140000, 8/512→150000, 16/512→160000 | `refurbished` |
| 6 | `prod-hp-probook-650-g5-i3-8th` | HP | ProBook 650 G5 (i3 8th) | 8/500 HDD | 8/500→115000, 8/256SSD→125000, 8/500+256SSD→140000, 16/500→135000, 16/500+256SSD→145000, 16/1TB→150000 | — |
| 7 | `prod-dell-latitude-e5550-i5-5th` | Dell | Latitude E5550 (i5 5th) | 4/128 SSD | 4/128→85000, 4/500→85000, 8/500→95000 | `refurbished` |
| 8 | `prod-dell-latitude-5400-i5-8th` | Dell | Latitude 5400 (i5 8th) | 8/256 SSD | 8/256→120000, 16/256→130000, 16/512→150000, 16/1TB→170000 | `promo` |
| 9 | `prod-hp-probook-645-g4-ryzen3` | HP | ProBook 645 G4 (Ryzen 3) | 8/500 HDD | 8/500→120000, 16/500→135000, 8/1TB→140000, 8/256SSD→130000, 16/256SSD→145000, 8/512SSD→150000, 16/512SSD→160000 | — |
| 10 | `prod-hp-probook-440-g5-i3-7th` | HP | ProBook 440 G5 Touch (i3 7th) | 4/128 SSD | 4/128→100000, 8/128→110000, 8/256→120000, 8/512→140000, 8/1TB→170000, 16/256→140000, 16/512→160000, 16/1TB→200000 | `refurbished` |
| 11 | `prod-lenovo-thinkpad-yoga-11e-i5-7th` | Lenovo | ThinkPad Yoga 11e (i5 7th) | 8/128 SSD | 8/128→85000, 8/256→95000 | — |
| 12 | `prod-lenovo-thinkpad-e470-i5-7th` | Lenovo | ThinkPad E470 (i5 7th) | 4/500 HDD | 4/500→90000, 8/500→95000 | — |
| 13 | `prod-dell-latitude-3380-i3-6th` | Dell | Latitude 3380 (i3 6th) | 8/500 HDD | 8/500→85000, 8/256SSD→90000, 8/1TB→110000 | `best-seller` |
| 14 | `prod-hp-probook-450-g7-i5-10th` | HP | ProBook 450 G7 (i5 10th) | 8/256 SSD | 8/256→140000, 8/512→160000, 16/256→155000, 16/512→170000 | `new-arrival` |
| 15 | `prod-lenovo-thinkpad-100w` | Lenovo | ThinkPad 100w (AMD Quad) | 4/64 SSD | 4/64→50000 | `new-arrival` |
| 16 | `prod-dell-precision-7560-xeon` | Dell | Precision 7560 (Xeon W-11855M) | 16/512 NVMe | 16/512→290000, 32/512→320000, 32/1TB→370000, 64/1TB→420000 | `promo` |
| 17 | `prod-hp-probook-640-g4-g5-i5-8th` | HP | ProBook 640 G4/G5 (i5 8th) | 8/500 HDD | 8/500→120000, 8/256SSD→125000, 8/1TB→135000, 16/500→130000, 16/500+128SSD→140000, 16/256SSD→135000, 16/512SSD→160000 | `refurbished` |
| 18 | `prod-lenovo-thinkpad-x390-i7-8th` | Lenovo | ThinkPad X390 Touch (i7 8th) | 16/256 SSD | 16/256→140000, 16/512→160000 | `promo` |

Total: 18 products, 1 REFURBISHED demo on #1.

(Spec values for `ProductFeatureValue` come from each listing's bullet list. Mapping is mechanical: each bullet → matching `ff-lap-*` id.)

## Ordered Tasks
1. **Create `prisma/prod-seed.ts`** with this structure:
   - Imports: `db` from `@/server/db`, `Prisma` from generated client (for `Prisma.InputJsonValue`).
   - Helper `mergeOptions(existing, incoming)`: union + de-dupe (case-insensitive trim) preserving order.
   - Helper `upsertFeatureField({ id, categoryId, name, type, options?, sortOrder, isRequired? })`: `findUnique` → if found, conditionally `update` (only when name/options differ); else `create`.
   - Helper `upsertVariantAxis({ id, categoryId, name, sortOrder, values: [{ id, value, sortOrder, priceDelta }] })`: upsert axis then upsert each value.
   - Helper `ensureBranch({ id, name, city, address, phone })`: `findUnique` → if missing, `create`. Logs "exists" if found, "created" if new.
   - Helper `seedProduct({ slug, name, brand, description, basePrice, categoryId, tags, variants: [{ sku, condition, stock, price, ram, storage }], featureValues: [{ fieldId, value }], images: [{ url, alt, isPrimary, sortOrder }] })`: upsert product → upsert variants → link variants to axis values via `ProductVariantOption` → insert feature values → distribute stock to branches.
2. **Branches**:
   - Run `ensureBranch` for the 4 branches. Only Buea will be created on a fresh DB; the others log "exists".
3. **Look up categories** by slug (`laptops`, `desktops`, `smartphones-iphone`, `tablets`). `findUnique`; if missing, log error and skip (the prod-seed assumes the dev seed has been run at least once for categories).
4. **Seed `laptops` feature fields** — 28 fields with stable ids `ff-lap-*`. Reuse existing ids (`ff-lap-cpu`, `ff-lap-ram`, `ff-lap-storage`, `ff-lap-display`) where already created in dev; the helper will skip re-creating.
5. **Seed variant axes for `laptops`** — calculate `priceDelta` per axis:
   - For `RAM`: collect all RAM prices from the 18 listings (e.g. 4GB baseline → 8GB delta, 8GB → 16GB delta, 16GB → 32GB delta, 32GB → 64GB delta). Average the deltas across listings where both tiers exist. If coefficient of variation > 35% across listings for a given delta, set that delta to `0` and store absolute prices on each variant. Otherwise use the average rounded to nearest 5,000 XAF.
   - For `Storage`: same approach (128GB baseline → 256GB → 512GB → 1TB → 2TB). Same 35% CV rule.
   - Document the calculated values as `const` near the top of the file so they're reviewable. Example shape (final values to be computed at implementation time):
     ```ts
     const RAM_DELTAS = { "4GB": 0, "8GB": 25000, "16GB": 35000, "32GB": 50000, "64GB": 80000 } // fallback to 0 if inconsistent
     const STORAGE_DELTAS = { "64GB": 0, "128GB": 10000, "256GB": 25000, "500GB": 20000, "512GB": 35000, "1TB": 50000, "2TB": 80000 }
     ```
   - If implementation finds the math is too inconsistent, use `priceDelta: 0` for every value and store the full tier price on each `ProductVariant`.
6. **Seed 18 products** from the data table. For each:
   a. `Product` upsert on `slug`.
   b. Create one `ProductVariant` per (RAM × Storage) combo in the listing's price table, with `sku` from D3.
   c. For each variant, create `ProductVariantOption` rows pointing to the matching `CategoryVariantAxisValue` (RAM + Storage).
   d. Insert `ProductFeatureValue` rows from the listing bullets.
   e. Insert `ProductImage` rows: 1 primary + 1 secondary `https://placehold.co/800x800/.../FFFFFF?text=...` per product, with brand-themed background colors.
   f. Connect tags by slug (`refurbished`, `promo`, `best-seller`, `new-arrival` — silently no-op if a tag doesn't exist; log warn).
   g. Distribute stock (5 units total per variant) to the 4 branches with 40/30/20/10 split.
7. **REFURBISHED demo variant** on `prod-lenovo-thinkpad-x1-carbon-i5-7th` 8/256 tier at 95000 XAF, plus 1 unit of stock split the same way.
8. **No price text or "Hunterman" references** anywhere in `description`, `metaDescription`, or `name`. Description is clean spec bullets only.
9. **Add npm script** `prisma:seed:prod` in `package.json`:
   ```json
   "prisma:seed:prod": "tsx prisma/prod-seed.ts"
   ```
10. **Top-of-file README comment** (inside `prod-seed.ts`, no external docs) listing run command and idempotency note.

## Files Touched
- **New**: `prisma/prod-seed.ts`
- **Modified**: `package.json` (1 npm script)

## Validation
1. `pnpm typecheck` must pass.
2. `pnpm lint` must pass.
3. After dev seed has been run once (`pnpm prisma:seed`), run `pnpm prisma:seed:prod`. Must complete without error.
4. Re-run `pnpm prisma:seed:prod` immediately after — must be a no-op (no duplicate rows, no errors).
5. In Prisma Studio (or admin UI), verify:
   - 4 branches present (Buea created).
   - `laptops` category has ~28 feature fields and 2 axes (`RAM`, `Storage`) with correct values and priceDeltas.
   - 18 products with `prod-` slug prefix exist.
   - Each product's variants are linked to the correct `RAM` × `Storage` axis values.
   - `ProductFeatureValue` count per product matches the number of bullets in its listing.

## Risks
- **priceDelta math may be inconsistent** across listings (e.g. some go +20k from 8GB→16GB, others +40k). Mitigation: 35% CV threshold for fallback to `priceDelta: 0`; tier prices are always stored on the variant as ground truth, so the UI still shows the right number regardless of axis deltas.
- **`CategoryFeatureField` collisions** with dev seed: resolved by `mergeOptions` union helper.
- **Tag slugs not present** in dev DB: warn-and-skip; the 4 tags (`promo`, `new-arrival`, `best-seller`, `refurbished`) are seeded by dev seed, so they should be present.
- **Decimal type for prices**: schema is `Decimal(12,2)`. Pass plain numbers; Prisma serializes correctly.
- **Crossed-out prices discarded**: acceptable per user. If they later want a "Was X / Now Y" UI element, a new migration adding `Product.compareAtPrice` would be needed.

## Open Questions
None blocking. All four questions from the previous round are resolved:
1. Referral prices: not stored anywhere — confirmed acceptable.
2. HP Laptop 14 duplicate tier: rename second to 16/512 SSD 170000 — confirmed acceptable.
3. Refurbished variants: only one demo on ThinkPad X1 Carbon — confirmed acceptable.
4. Default stock: 5 units per variant — confirmed acceptable.
