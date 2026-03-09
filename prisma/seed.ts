import { db } from "@/server/db"





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
  const baseAssetUrl = "/assets/samples/products"

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
          { url: `${baseAssetUrl}/earphones_a_1.webp`, alt: "Apple AirPods Pro 2 vue 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/earphones_a_2.webp`, alt: "Apple AirPods Pro 2 vue 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/earphones_a_3.webp`, alt: "Apple AirPods Pro 2 vue 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/earphones_a_4.webp`, alt: "Apple AirPods Pro 2 vue 4", isPrimary: false, sortOrder: 3 },
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

  // Additional earphones products
  const earphones_b = await db.product.upsert({
    where: { slug: "earphones-standard" },
    update: {},
    create: {
      slug: "earphones-standard",
      name: "Écouteurs Standard",
      description: "Écouteurs filaires de qualité avec driver haute performance et confort optimal.",
      basePrice: 45000,
      currency: "XAF",
      categoryId: audio.id,
      brand: "Audio Pro",
      specs: { connectivity: "Filaire", impedance: "32Ω", frequency: "20Hz-20kHz" },
      metaTitle: "Écouteurs Standard - Achat en ligne | The Eye Informatique",
      metaDescription: "Écouteurs filaires au meilleur prix au Cameroun.",
      isActive: true,
      isFeatured: false,
      tags: { connect: [{ slug: "best-seller" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/earphones_b_1.webp`, alt: "Écouteurs Standard vue 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/earphones_b_2.webp`, alt: "Écouteurs Standard vue 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/earphones_b_3.webp`, alt: "Écouteurs Standard vue 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/earphones_b_4.webp`, alt: "Écouteurs Standard vue 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "EARPH-STD-BLK", color: "Noir", condition: "NEW", stock: 15, price: 45000, weight: 0.08 },
          { sku: "EARPH-STD-WHT", color: "Blanc", condition: "NEW", stock: 12, price: 45000, weight: 0.08 },
        ],
      },
    },
    include: { variants: true },
  })

  const earphones_c = await db.product.upsert({
    where: { slug: "earphones-premium" },
    update: {},
    create: {
      slug: "earphones-premium",
      name: "Écouteurs Premium",
      description: "Écouteurs sans fil haut de gamme avec technologie noise-cancelling.",
      basePrice: 125000,
      currency: "XAF",
      categoryId: audio.id,
      brand: "Premium Audio",
      specs: { connectivity: "Bluetooth 5.0", anc: "Oui", battery: "8h" },
      metaTitle: "Écouteurs Premium - Achat en ligne | The Eye Informatique",
      metaDescription: "Écouteurs sans fil premium avec réduction de bruit au Cameroun.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "new-arrival" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/earphones_c_1.webp`, alt: "Écouteurs Premium vue 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/earphones_c_2.webp`, alt: "Écouteurs Premium vue 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/earphones_c_3.webp`, alt: "Écouteurs Premium vue 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/earphones_c_4.webp`, alt: "Écouteurs Premium vue 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "EARPH-PREM-BLK", color: "Noir", condition: "NEW", stock: 18, price: 125000, weight: 0.085 },
          { sku: "EARPH-PREM-SLV", color: "Argent", condition: "NEW", stock: 12, price: 125000, weight: 0.085 },
        ],
      },
    },
    include: { variants: true },
  })

  // Headphones products
  const headphones_a = await db.product.upsert({
    where: { slug: "headphones-sport" },
    update: {},
    create: {
      slug: "headphones-sport",
      name: "Casque Sport",
      description: "Casque audio filaire confortable pour les séances de sport avec prise renforcée.",
      basePrice: 55000,
      currency: "XAF",
      categoryId: audio.id,
      brand: "Sport Audio",
      specs: { connectivity: "Filaire", weight: "150g", impedance: "32Ω" },
      metaTitle: "Casque Sport - Achat en ligne | The Eye Informatique",
      metaDescription: "Casque audio sport au Cameroun - confortable et durable.",
      isActive: true,
      isFeatured: false,
      tags: { connect: [{ slug: "new-arrival" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/headphones_a_1.webp`, alt: "Casque Sport vue 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/headphones_a_2.webp`, alt: "Casque Sport vue 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/headphones_a_3.webp`, alt: "Casque Sport vue 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/headphones_a_4.webp`, alt: "Casque Sport vue 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "HEAD-SPORT-BLK", color: "Noir", condition: "NEW", stock: 20, price: 55000, weight: 0.15 },
          { sku: "HEAD-SPORT-BLU", color: "Bleu", condition: "NEW", stock: 16, price: 55000, weight: 0.15 },
        ],
      },
    },
    include: { variants: true },
  })

  const headphones_b = await db.product.upsert({
    where: { slug: "headphones-gaming" },
    update: {},
    create: {
      slug: "headphones-gaming",
      name: "Casque Gaming",
      description: "Casque de gaming sans fil avec son surround 7.1 et microphone détachable.",
      basePrice: 185000,
      currency: "XAF",
      categoryId: audio.id,
      brand: "Gaming Gear",
      specs: { connectivity: "Wireless 2.4GHz", sound: "7.1 Surround", mic: "Oui" },
      metaTitle: "Casque Gaming - Achat en ligne | The Eye Informatique",
      metaDescription: "Casque gaming sans fil au Cameroun - expérience immersive.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "best-seller" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/headphones_b_1.webp`, alt: "Casque Gaming vue 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/headphones_b_2.webp`, alt: "Casque Gaming vue 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/headphones_b_3.webp`, alt: "Casque Gaming vue 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/headphones_b_4.webp`, alt: "Casque Gaming vue 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "HEAD-GAME-BLK", color: "Noir", condition: "NEW", stock: 14, price: 185000, weight: 0.32 },
          { sku: "HEAD-GAME-RED", color: "Noir & Rouge", condition: "NEW", stock: 11, price: 185000, weight: 0.32 },
        ],
      },
    },
    include: { variants: true },
  })

  const headphones_c = await db.product.upsert({
    where: { slug: "headphones-studio" },
    update: {},
    create: {
      slug: "headphones-studio",
      name: "Casque Studio",
      description: "Casque de monitoring professionnel pour studio d'enregistrement et production audio.",
      basePrice: 275000,
      currency: "XAF",
      categoryId: audio.id,
      brand: "Pro Audio",
      specs: { connectivity: "Filaire", frequency: "5Hz-40kHz", impedance: "32Ω" },
      metaTitle: "Casque Studio - Achat en ligne | The Eye Informatique",
      metaDescription: "Casque audio studio professionnel au Cameroun.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "best-seller" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/headphones_c_1.webp`, alt: "Casque Studio vue 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/headphones_c_2.webp`, alt: "Casque Studio vue 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/headphones_c_3.webp`, alt: "Casque Studio vue 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/headphones_c_4.webp`, alt: "Casque Studio vue 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "HEAD-STUDIO-WHT", color: "Blanc", condition: "NEW", stock: 9, price: 275000, weight: 0.25 },
          { sku: "HEAD-STUDIO-GRY", color: "Gris", condition: "NEW", stock: 7, price: 275000, weight: 0.25 },
        ],
      },
    },
    include: { variants: true },
  })

  // Speaker product
  const speaker = await db.product.upsert({
    where: { slug: "portable-speaker" },
    update: {},
    create: {
      slug: "portable-speaker",
      name: "Haut-parleur Portable",
      description: "Haut-parleur Bluetooth portable avec LED RGB et batterie longue durée.",
      basePrice: 95000,
      currency: "XAF",
      categoryId: audio.id,
      brand: "Portable Sound",
      specs: { connectivity: "Bluetooth 5.0", power: "20W", battery: "12h" },
      metaTitle: "Haut-parleur Portable - Achat en ligne | The Eye Informatique",
      metaDescription: "Haut-parleur Bluetooth portable au Cameroun avec LED RGB.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "new-arrival" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/speaker1.webp`, alt: "Haut-parleur Portable vue 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/speaker2.webp`, alt: "Haut-parleur Portable vue 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/speaker3.webp`, alt: "Haut-parleur Portable vue 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/speaker4.webp`, alt: "Haut-parleur Portable vue 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "SPEAK-PORT-BLK", color: "Noir", condition: "NEW", stock: 22, price: 95000, weight: 0.58 },
          { sku: "SPEAK-PORT-BLU", color: "Bleu", condition: "NEW", stock: 18, price: 95000, weight: 0.58 },
        ],
      },
    },
    include: { variants: true },
  })

  // Smartwatch product
  const watch = await db.product.upsert({
    where: { slug: "smartwatch-fitness" },
    update: {},
    create: {
      slug: "smartwatch-fitness",
      name: "Montre Connectée Fitness",
      description: "Smartwatch avec suivi de la fréquence cardiaque, compteur de pas et notifications.",
      basePrice: 75000,
      currency: "XAF",
      categoryId: accessoires.id,
      brand: "Fitness Tech",
      specs: { screen: "1.4\" AMOLED", battery: "5 jours", waterproof: "50m" },
      metaTitle: "Montre Connectée Fitness - Achat en ligne | The Eye Informatique",
      metaDescription: "Smartwatch fitness moins cher au Cameroun - suivi santé complet.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "new-arrival" }, { slug: "best-seller" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/watch_1.webp`, alt: "Montre Connectée Fitness vue 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/watch_2.webp`, alt: "Montre Connectée Fitness vue 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/watch_3.webp`, alt: "Montre Connectée Fitness vue 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/watch_4.webp`, alt: "Montre Connectée Fitness vue 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "WATCH-FIT-BLK", color: "Noir", condition: "NEW", stock: 26, price: 75000, weight: 0.042 },
          { sku: "WATCH-FIT-BLU", color: "Bleu", condition: "NEW", stock: 19, price: 75000, weight: 0.042 },
          { sku: "WATCH-FIT-RED", color: "Rouge", condition: "NEW", stock: 15, price: 75000, weight: 0.042 },
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
    ...earphones_b.variants,
    ...earphones_c.variants,
    ...headphones_a.variants,
    ...headphones_b.variants,
    ...headphones_c.variants,
    ...speaker.variants,
    ...watch.variants,
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
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n✅  Seed complete!")
  console.log("   Branches :", [yaoundeBranch.name, douala.name].join(", "))
  console.log("   Products :", 11, "products seeded")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
