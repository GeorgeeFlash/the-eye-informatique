import { db } from "@/server/db"
import { clerkClient } from "@clerk/nextjs/server"



// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a Clerk user idempotently.
 * If the email already exists in Clerk, fetch and return that existing user.
 * Returns the Clerk user ID.
 */
async function upsertClerkUser(opts: {
  firstName: string
  lastName: string
  email: string
  password: string
}): Promise<string> {
  const clerk = await clerkClient()
  try {
    const user = await clerk.users.createUser({
      firstName: opts.firstName,
      lastName: opts.lastName,
      emailAddress: [opts.email],
      password: opts.password,
    })
    return user.id
  } catch (err: unknown) {
    // Clerk returns a 422 with code "form_identifier_exists" when the email is taken
    const isAlreadyExists =
      typeof err === "object" &&
      err !== null &&
      "errors" in err &&
      Array.isArray((err as { errors: { code: string }[] }).errors) &&
      (err as { errors: { code: string }[] }).errors.some(
        (e) => e.code === "form_identifier_exists",
      )

    if (isAlreadyExists) {
      const list = await clerk.users.getUserList({
        emailAddress: [opts.email],
      })
      const existing = list.data[0]
      if (!existing) throw new Error(`Could not find existing Clerk user for ${opts.email}`)
      return existing.id
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  Seeding database…")

  // -------------------------------------------------------------------------
  // 1. Branches
  // -------------------------------------------------------------------------
  const yaoundeBranch = await db.branch.upsert({
    where: { id: "branch-yaounde" },
    update: {},
    create: {
      id: "branch-yaounde",
      name: "TEI Yaoundé - Siège",
      city: "Yaoundé",
      address: "Avenue Kennedy, Centre-ville",
      phone: "+237 222 000 000",
      isActive: true,
    },
  })

  const douala = await db.branch.upsert({
    where: { id: "branch-douala" },
    update: {},
    create: {
      id: "branch-douala",
      name: "TEI Douala",
      city: "Douala",
      address: "Rue de la Joie, Akwa",
      phone: "+237 233 000 000",
      isActive: true,
    },
  })

  console.log("  ✔ Branches")

  // -------------------------------------------------------------------------
  // 2. Categories
  // -------------------------------------------------------------------------
  const smartphones = await db.category.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: { name: "Smartphones", slug: "smartphones", sortOrder: 1 },
  })

  const ordinateurs = await db.category.upsert({
    where: { slug: "ordinateurs" },
    update: {},
    create: { name: "Ordinateurs", slug: "ordinateurs", sortOrder: 2 },
  })

  const accessoires = await db.category.upsert({
    where: { slug: "accessoires" },
    update: {},
    create: { name: "Accessoires", slug: "accessoires", sortOrder: 3 },
  })

  const audio = await db.category.upsert({
    where: { slug: "audio" },
    update: {},
    create: { name: "Audio", slug: "audio", sortOrder: 4 },
  })

  // Sub-categories — Smartphones
  await db.category.upsert({
    where: { slug: "smartphones-android" },
    update: {},
    create: { name: "Android", slug: "smartphones-android", parentId: smartphones.id, sortOrder: 1 },
  })
  await db.category.upsert({
    where: { slug: "smartphones-iphone" },
    update: {},
    create: { name: "iPhone", slug: "smartphones-iphone", parentId: smartphones.id, sortOrder: 2 },
  })
  await db.category.upsert({
    where: { slug: "tablettes" },
    update: {},
    create: { name: "Tablettes", slug: "tablettes", parentId: smartphones.id, sortOrder: 3 },
  })

  // Sub-categories — Ordinateurs
  await db.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: { name: "Laptops", slug: "laptops", parentId: ordinateurs.id, sortOrder: 1 },
  })
  await db.category.upsert({
    where: { slug: "desktops" },
    update: {},
    create: { name: "Desktops", slug: "desktops", parentId: ordinateurs.id, sortOrder: 2 },
  })

  // Sub-categories — Accessoires
  await db.category.upsert({
    where: { slug: "chargeurs-cables" },
    update: {},
    create: { name: "Chargeurs & Câbles", slug: "chargeurs-cables", parentId: accessoires.id, sortOrder: 1 },
  })
  await db.category.upsert({
    where: { slug: "coques-protections" },
    update: {},
    create: { name: "Coques & Protections", slug: "coques-protections", parentId: accessoires.id, sortOrder: 2 },
  })

  // Sub-categories — Audio
  await db.category.upsert({
    where: { slug: "ecouteurs" },
    update: {},
    create: { name: "Écouteurs", slug: "ecouteurs", parentId: audio.id, sortOrder: 1 },
  })
  await db.category.upsert({
    where: { slug: "haut-parleurs" },
    update: {},
    create: { name: "Haut-parleurs", slug: "haut-parleurs", parentId: audio.id, sortOrder: 2 },
  })

  console.log("  ✔ Categories")

  // -------------------------------------------------------------------------
  // 3. Tags
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tagPromo = await db.tag.upsert({
    where: { slug: "promo" },
    update: {},
    create: { name: "Promo", slug: "promo" },
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tagNew = await db.tag.upsert({
    where: { slug: "new-arrival" },
    update: {},
    create: { name: "Nouveauté", slug: "new-arrival" },
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tagBestSeller = await db.tag.upsert({
    where: { slug: "best-seller" },
    update: {},
    create: { name: "Meilleure vente", slug: "best-seller" },
  })
  await db.tag.upsert({
    where: { slug: "refurbished" },
    update: {},
    create: { name: "Reconditionné", slug: "refurbished" },
  })

  console.log("  ✔ Tags")

  // -------------------------------------------------------------------------
  // 4. Settings
  // -------------------------------------------------------------------------
  await db.setting.upsert({
    where: { key: "commission_rate" },
    update: {},
    create: { key: "commission_rate", value: { rate: 3 } },
  })
  await db.setting.upsert({
    where: { key: "low_stock_threshold" },
    update: {},
    create: { key: "low_stock_threshold", value: { units: 3 } },
  })
  await db.setting.upsert({
    where: { key: "after_sales_request_window_days" },
    update: {},
    create: { key: "after_sales_request_window_days", value: { days: 30 } },
  })
  await db.setting.upsert({
    where: { key: "affiliate_re_application_wait_days" },
    update: {},
    create: { key: "affiliate_re_application_wait_days", value: { days: 30 } },
  })

  console.log("  ✔ Settings")

  // -------------------------------------------------------------------------
  // 5. Sample products
  // -------------------------------------------------------------------------
  const samsung = await db.product.upsert({
    where: { slug: "samsung-galaxy-a55-5g" },
    update: {},
    create: {
      slug: "samsung-galaxy-a55-5g",
      name: "Samsung Galaxy A55 5G",
      description: "Smartphone Android milieu de gamme avec écran AMOLED 6.6\", appareil photo 50 MP et batterie 5000 mAh.",
      basePrice: 245000,
      currency: "XAF",
      categoryId: smartphones.id,
      brand: "Samsung",
      specs: { ram: "8 Go", storage: "128 Go", screen: "6.6\" AMOLED", battery: "5000 mAh" },
      metaTitle: "Samsung Galaxy A55 5G - Achat en ligne | The Eye Informatique",
      metaDescription: "Achetez le Samsung Galaxy A55 5G au Cameroun. Livraison à Yaoundé et Douala.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "new-arrival" }, { slug: "best-seller" }] },
      images: {
        create: [
          { url: "https://placehold.co/800x800/1a1a2e/FFFFFF?text=Galaxy+A55", alt: "Samsung Galaxy A55 5G", isPrimary: true, sortOrder: 0 },
          { url: "https://placehold.co/800x800/16213e/FFFFFF?text=Galaxy+A55+Side", alt: "Samsung Galaxy A55 5G côté", isPrimary: false, sortOrder: 1 },
        ],
      },
      variants: {
        create: [
          { sku: "SAM-A55-BLK-128", color: "Noir Awesome", condition: "NEW", stock: 20, price: 245000, weight: 0.213 },
          { sku: "SAM-A55-BLU-128", color: "Bleu Awesome", condition: "NEW", stock: 15, price: 245000, weight: 0.213 },
          { sku: "SAM-A55-BLK-128-REF", color: "Noir Awesome", condition: "REFURBISHED", stock: 8, price: 195000, weight: 0.213 },
        ],
      },
    },
    include: { variants: true },
  })

  const macbook = await db.product.upsert({
    where: { slug: "apple-macbook-air-m2" },
    update: {},
    create: {
      slug: "apple-macbook-air-m2",
      name: "Apple MacBook Air M2",
      description: "Laptop ultra-fin avec puce Apple M2, écran Liquid Retina 13.6\" et autonomie jusqu'à 18 heures.",
      basePrice: 895000,
      currency: "XAF",
      categoryId: ordinateurs.id,
      brand: "Apple",
      specs: { chip: "Apple M2", ram: "8 Go", storage: "256 Go SSD", screen: "13.6\" Liquid Retina", battery: "18h" },
      metaTitle: "MacBook Air M2 - Achat en ligne | The Eye Informatique",
      metaDescription: "MacBook Air M2 disponible au Cameroun. Garantie incluse.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "best-seller" }] },
      images: {
        create: [
          { url: "https://placehold.co/800x800/1a1a2e/FFFFFF?text=MacBook+Air+M2", alt: "Apple MacBook Air M2", isPrimary: true, sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "MBA-M2-SLV-256", color: "Argent", condition: "NEW", stock: 10, price: 895000, weight: 1.24 },
          { sku: "MBA-M2-STG-256", color: "Gris sidéral", condition: "NEW", stock: 7, price: 895000, weight: 1.24 },
          { sku: "MBA-M2-SLV-256-REF", color: "Argent", condition: "REFURBISHED", stock: 4, price: 720000, weight: 1.24 },
        ],
      },
    },
    include: { variants: true },
  })

  const airpods = await db.product.upsert({
    where: { slug: "apple-airpods-pro-2" },
    update: {},
    create: {
      slug: "apple-airpods-pro-2",
      name: "Apple AirPods Pro 2ème génération",
      description: "Écouteurs sans fil avec réduction active du bruit adaptative et audio spatial personnalisé.",
      basePrice: 155000,
      currency: "XAF",
      categoryId: audio.id,
      brand: "Apple",
      specs: { connectivity: "Bluetooth 5.3", anc: "Oui", battery: "6h (30h avec boîtier)" },
      metaTitle: "AirPods Pro 2 - Achat en ligne | The Eye Informatique",
      metaDescription: "Apple AirPods Pro 2ème génération disponibles au Cameroun.",
      isActive: true,
      isFeatured: false,
      tags: { connect: [{ slug: "promo" }] },
      images: {
        create: [
          { url: "https://placehold.co/800x800/f0f0f0/333333?text=AirPods+Pro+2", alt: "Apple AirPods Pro 2", isPrimary: true, sortOrder: 0 },
        ],
      },
      variants: {
        create: [
          { sku: "APP-PRO2-WHT", color: "Blanc", condition: "NEW", stock: 25, price: 155000, weight: 0.061 },
          { sku: "APP-PRO2-WHT-REF", color: "Blanc", condition: "REFURBISHED", stock: 6, price: 119000, weight: 0.061 },
        ],
      },
    },
    include: { variants: true },
  })

  console.log("  ✔ Products")

  // -------------------------------------------------------------------------
  // 6. ProductStockByBranch — per-branch inventory for each variant
  // -------------------------------------------------------------------------
  const allVariants = [
    ...samsung.variants,
    ...macbook.variants,
    ...airpods.variants,
  ]

  for (const variant of allVariants) {
    const totalStock = variant.stock
    // Split roughly 60% Yaoundé / 40% Douala
    const ydeStock = Math.round(totalStock * 0.6)
    const dlaStock = totalStock - ydeStock

    await db.productStockByBranch.upsert({
      where: { variantId_branchId: { variantId: variant.id, branchId: yaoundeBranch.id } },
      update: {},
      create: { variantId: variant.id, branchId: yaoundeBranch.id, stock: ydeStock, lowStockThreshold: 3 },
    })
    await db.productStockByBranch.upsert({
      where: { variantId_branchId: { variantId: variant.id, branchId: douala.id } },
      update: {},
      create: { variantId: variant.id, branchId: douala.id, stock: dlaStock, lowStockThreshold: 3 },
    })
  }

  console.log("  ✔ ProductStockByBranch")

  // -------------------------------------------------------------------------
  // 7. Seed users (Clerk + Prisma)
  // -------------------------------------------------------------------------
  const SEED_PASSWORD = "TeiStore2026!"

  const seedUsers = [
    { firstName: "Customer", lastName: "Tei", email: "ninobav359@him6.com", role: "CUSTOMER" as const, branchId: null },
    { firstName: "Affiliate", lastName: "Tei", email: "affiliate@tei-store.test", role: "AFFILIATE" as const, branchId: null },
    { firstName: "Staff", lastName: "Tei", email: "staff@tei-store.test", role: "STAFF" as const, branchId: yaoundeBranch.id },
    { firstName: "Admin", lastName: "Tei", email: "admin@tei-store.test", role: "ADMIN" as const, branchId: yaoundeBranch.id },
    { firstName: "Central", lastName: "Admin", email: "central@tei-store.test", role: "CENTRAL_ADMIN" as const, branchId: null },
  ]

  const createdUsers: { role: string; clerkId: string; dbId: string }[] = []

  for (const u of seedUsers) {
    const clerkId = await upsertClerkUser({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: SEED_PASSWORD,
    })

    const dbUser = await db.user.upsert({
      where: { clerkId },
      update: { role: u.role, branchId: u.branchId },
      create: {
        clerkId,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        branchId: u.branchId,
        preferredLocale: "en",
      },
    })

    createdUsers.push({ role: u.role, clerkId, dbId: dbUser.id })
    console.log(`    ✔ ${u.role} — ${u.email}`)
  }

  console.log("  ✔ Users (Clerk + Prisma)")

  // -------------------------------------------------------------------------
  // 8. Affiliate profile for the AFFILIATE seed user
  // -------------------------------------------------------------------------
  const affiliateDbUser = createdUsers.find((u) => u.role === "AFFILIATE")!

  const affiliateProfile = await db.affiliateProfile.upsert({
    where: { userId: affiliateDbUser.dbId },
    update: {},
    create: {
      userId: affiliateDbUser.dbId,
      status: "APPROVED",
      commissionRate: 0.03,
      payoutMethod: "MOBILE_MONEY",
      payoutPhone: "+237690000001",
      websiteUrl: "https://affiliate.tei-store.test",
    },
  })

  await db.affiliateLink.upsert({
    where: { code: "TEI-AFF-001" },
    update: {},
    create: {
      affiliateId: affiliateProfile.id,
      code: "TEI-AFF-001",
      targetUrl: "/products",
      clickCount: 0,
    },
  })

  console.log("  ✔ AffiliateProfile + AffiliateLink")

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n✅  Seed complete!")
  console.log("   Branches :", [yaoundeBranch.name, douala.name].join(", "))
  console.log("   Products :", [samsung.name, macbook.name, airpods.name].join(", "))
  console.log("   Users    :", createdUsers.map((u) => u.role).join(", "))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
