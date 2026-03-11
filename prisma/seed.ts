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
      address: "Kennedy Avenue, City Center",
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
      address: "Joy Street, Akwa",
      phone: "+237 233 000 000",
      isActive: true,
    },
  })

  const bamenda = await db.branch.upsert({
    where: { id: "branch-bamenda" },
    update: {},
    create: {
      id: "branch-bamenda",
      name: "TEI Bamenda - Head Office",
      city: "Bamenda",
      address: "Foncha Junction, Nkwen",
      phone: "+237 233 111 111",
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
    where: { slug: "computers" },
    update: {},
    create: { name: "Computers", slug: "computers", sortOrder: 2 },
  })

  const accessoires = await db.category.upsert({
    where: { slug: "accessories" },
    update: {},
    create: { name: "Accessories", slug: "accessories", sortOrder: 3 },
  })

  const audio = await db.category.upsert({
    where: { slug: "audio" },
    update: {},
    create: { name: "Audio", slug: "audio", sortOrder: 4 },
  })

  // Sub-categories — Smartphones
  const smartphonesAndroid = await db.category.upsert({
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
    where: { slug: "tablets" },
    update: {},
    create: { name: "Tablets", slug: "tablets", parentId: smartphones.id, sortOrder: 3 },
  })

  // Sub-categories — Ordinateurs
  const laptops = await db.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: { name: "Laptops", slug: "laptops", parentId: ordinateurs.id, sortOrder: 1 },
  })
  await db.category.upsert({
    where: { slug: "desktops" },
    update: {},
    create: { name: "Desktops", slug: "desktops", parentId: ordinateurs.id, sortOrder: 2 },
  })

  // Sub-categories — Accessories
  await db.category.upsert({
    where: { slug: "chargers-cables" },
    update: {},
    create: { name: "Chargers & Cables", slug: "chargers-cables", parentId: accessoires.id, sortOrder: 1 },
  })
  await db.category.upsert({
    where: { slug: "cases-protections" },
    update: {},
    create: { name: "Cases & Screen Protectors", slug: "cases-protections", parentId: accessoires.id, sortOrder: 2 },
  })

  // Sub-categories — Audio
  const ecouteurs = await db.category.upsert({
    where: { slug: "earphones" },
    update: {},
    create: { name: "Earphones", slug: "earphones", parentId: audio.id, sortOrder: 1 },
  })
  const hautParleurs = await db.category.upsert({
    where: { slug: "speakers" },
    update: {},
    create: { name: "Speakers", slug: "speakers", parentId: audio.id, sortOrder: 2 },
  })

  console.log("  ✔ Categories")

  // -------------------------------------------------------------------------
  // 2b. CategoryFeatureFields — structured attributes per sub-category
  // -------------------------------------------------------------------------

  // Smartphones — Android
  await db.categoryFeatureField.upsert({ where: { id: "ff-and-screen" }, update: {}, create: { id: "ff-and-screen", categoryId: smartphonesAndroid.id, name: "Screen Size", type: "TEXT", sortOrder: 1 } })
  await db.categoryFeatureField.upsert({ where: { id: "ff-and-ram" }, update: {}, create: { id: "ff-and-ram", categoryId: smartphonesAndroid.id, name: "RAM", type: "DROPDOWN", options: ["4GB", "6GB", "8GB", "12GB", "16GB"], sortOrder: 2 } })
  await db.categoryFeatureField.upsert({ where: { id: "ff-and-storage" }, update: {}, create: { id: "ff-and-storage", categoryId: smartphonesAndroid.id, name: "Storage", type: "DROPDOWN", options: ["64GB", "128GB", "256GB", "512GB"], sortOrder: 3 } })
  await db.categoryFeatureField.upsert({ where: { id: "ff-and-battery" }, update: {}, create: { id: "ff-and-battery", categoryId: smartphonesAndroid.id, name: "Battery", type: "TEXT", sortOrder: 4 } })

  // Laptops
  await db.categoryFeatureField.upsert({ where: { id: "ff-lap-cpu" }, update: {}, create: { id: "ff-lap-cpu", categoryId: laptops.id, name: "Processor", type: "TEXT", sortOrder: 1 } })
  await db.categoryFeatureField.upsert({ where: { id: "ff-lap-ram" }, update: {}, create: { id: "ff-lap-ram", categoryId: laptops.id, name: "RAM", type: "DROPDOWN", options: ["8GB", "16GB", "32GB", "64GB"], sortOrder: 2 } })
  await db.categoryFeatureField.upsert({ where: { id: "ff-lap-storage" }, update: {}, create: { id: "ff-lap-storage", categoryId: laptops.id, name: "Storage", type: "DROPDOWN", options: ["256GB", "512GB", "1TB", "2TB"], sortOrder: 3 } })
  await db.categoryFeatureField.upsert({ where: { id: "ff-lap-display" }, update: {}, create: { id: "ff-lap-display", categoryId: laptops.id, name: "Screen Size", type: "TEXT", sortOrder: 4 } })

  // Earphones
  await db.categoryFeatureField.upsert({ where: { id: "ff-ecu-conn" }, update: {}, create: { id: "ff-ecu-conn", categoryId: ecouteurs.id, name: "Connectivity", type: "DROPDOWN", options: ["Wired", "Bluetooth", "Wireless"], sortOrder: 1 } })
  await db.categoryFeatureField.upsert({ where: { id: "ff-ecu-nc" }, update: {}, create: { id: "ff-ecu-nc", categoryId: ecouteurs.id, name: "Noise Cancellation", type: "DROPDOWN", options: ["Yes", "No"], sortOrder: 2 } })

  // Speakers
  await db.categoryFeatureField.upsert({ where: { id: "ff-hp-conn" }, update: {}, create: { id: "ff-hp-conn", categoryId: hautParleurs.id, name: "Connectivity", type: "DROPDOWN", options: ["Bluetooth", "Wired", "Wi-Fi"], sortOrder: 1 } })
  await db.categoryFeatureField.upsert({ where: { id: "ff-hp-battery" }, update: {}, create: { id: "ff-hp-battery", categoryId: hautParleurs.id, name: "Battery Life", type: "TEXT", sortOrder: 2 } })

  console.log("  ✔ Feature Fields")

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
    create: { name: "New Arrival", slug: "new-arrival" },
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tagBestSeller = await db.tag.upsert({
    where: { slug: "best-seller" },
    update: {},
    create: { name: "Best Seller", slug: "best-seller" },
  })
  await db.tag.upsert({
    where: { slug: "refurbished" },
    update: {},
    create: { name: "Refurbished", slug: "refurbished" },
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
      description: "Mid-range Android smartphone with 6.6\" AMOLED display, 50 MP camera and 5000 mAh battery.",
      basePrice: 245000,
      currency: "XAF",
      categoryId: smartphonesAndroid.id,
      brand: "Samsung",
      metaTitle: "Samsung Galaxy A55 5G - Online Purchase | The Eye Informatique",
      metaDescription: "Buy the Samsung Galaxy A55 5G in Cameroon. Delivery to Yaoundé, Douala and Bamenda.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "new-arrival" }, { slug: "best-seller" }] },
      images: {
        create: [
          { url: "https://placehold.co/800x800/1a1a2e/FFFFFF?text=Galaxy+A55", alt: "Samsung Galaxy A55 5G", isPrimary: true, sortOrder: 0 },
          { url: "https://placehold.co/800x800/16213e/FFFFFF?text=Galaxy+A55+Side", alt: "Samsung Galaxy A55 5G side", isPrimary: false, sortOrder: 1 },
        ],
      },
      variants: {
        create: [
          { sku: "SAM-A55-BLK-128", color: "Awesome Black", condition: "NEW", stock: 20, price: 245000, weight: 0.213 },
          { sku: "SAM-A55-BLU-128", color: "Awesome Blue", condition: "NEW", stock: 15, price: 245000, weight: 0.213 },
          { sku: "SAM-A55-BLK-128-REF", color: "Awesome Black", condition: "REFURBISHED", stock: 8, price: 195000, weight: 0.213 },
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
      description: "Ultra-thin laptop with Apple M2 chip, 13.6\" Liquid Retina display and up to 18 hours battery life.",
      basePrice: 895000,
      currency: "XAF",
      categoryId: laptops.id,
      brand: "Apple",
      metaTitle: "MacBook Air M2 - Online Purchase | The Eye Informatique",
      metaDescription: "MacBook Air M2 available in Cameroon. Warranty included.",
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
          { sku: "MBA-M2-SLV-256", color: "Silver", condition: "NEW", stock: 10, price: 895000, weight: 1.24 },
          { sku: "MBA-M2-STG-256", color: "Space Gray", condition: "NEW", stock: 7, price: 895000, weight: 1.24 },
          { sku: "MBA-M2-SLV-256-REF", color: "Silver", condition: "REFURBISHED", stock: 4, price: 720000, weight: 1.24 },
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
      name: "Apple AirPods Pro 2nd Generation",
      description: "Wireless earphones with adaptive active noise cancellation and personalized spatial audio.",
      basePrice: 155000,
      currency: "XAF",
      categoryId: ecouteurs.id,
      brand: "Apple",
      metaTitle: "AirPods Pro 2nd Gen - Buy Online | The Eye Informatique",
      metaDescription: "Apple AirPods Pro 2nd Generation available in Cameroon.",
      isActive: true,
      isFeatured: false,
      tags: { connect: [{ slug: "promo" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/earphones_a_1.webp`, alt: "Apple AirPods Pro 2 view 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/earphones_a_2.webp`, alt: "Apple AirPods Pro 2 view 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/earphones_a_3.webp`, alt: "Apple AirPods Pro 2 view 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/earphones_a_4.webp`, alt: "Apple AirPods Pro 2 view 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "APP-PRO2-WHT", color: "White", condition: "NEW", stock: 25, price: 155000, weight: 0.061 },
          { sku: "APP-PRO2-WHT-REF", color: "White", condition: "REFURBISHED", stock: 6, price: 119000, weight: 0.061 },
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
      name: "Standard Earphones",
      description: "Quality wired earphones with high-performance driver and optimal comfort.",
      basePrice: 45000,
      currency: "XAF",
      categoryId: ecouteurs.id,
      brand: "Audio Pro",
      metaTitle: "Standard Earphones - Buy Online | The Eye Informatique",
      metaDescription: "Wired earphones at the best price in Cameroon.",
      isActive: true,
      isFeatured: false,
      tags: { connect: [{ slug: "best-seller" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/earphones_b_1.webp`, alt: "Standard Earphones view 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/earphones_b_2.webp`, alt: "Standard Earphones view 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/earphones_b_3.webp`, alt: "Standard Earphones view 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/earphones_b_4.webp`, alt: "Standard Earphones view 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "EARPH-STD-BLK", color: "Black", condition: "NEW", stock: 15, price: 45000, weight: 0.08 },
          { sku: "EARPH-STD-WHT", color: "White", condition: "NEW", stock: 12, price: 45000, weight: 0.08 },
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
      name: "Premium Earphones",
      description: "High-end wireless earphones with noise-cancelling technology.",
      basePrice: 125000,
      currency: "XAF",
      categoryId: ecouteurs.id,
      brand: "Premium Audio",
      metaTitle: "Premium Earphones - Buy Online | The Eye Informatique",
      metaDescription: "Premium wireless earphones with noise cancellation in Cameroon.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "new-arrival" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/earphones_c_1.webp`, alt: "Premium Earphones view 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/earphones_c_2.webp`, alt: "Premium Earphones view 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/earphones_c_3.webp`, alt: "Premium Earphones view 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/earphones_c_4.webp`, alt: "Premium Earphones view 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "EARPH-PREM-BLK", color: "Black", condition: "NEW", stock: 18, price: 125000, weight: 0.085 },
          { sku: "EARPH-PREM-SLV", color: "Silver", condition: "NEW", stock: 12, price: 125000, weight: 0.085 },
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
      name: "Sport Headphones",
      description: "Comfortable wired sport headphones with reinforced jack for workout sessions.",
      basePrice: 55000,
      currency: "XAF",
      categoryId: ecouteurs.id,
      brand: "Sport Audio",
      metaTitle: "Sport Headphones - Buy Online | The Eye Informatique",
      metaDescription: "Sport headphones in Cameroon - comfortable and durable.",
      isActive: true,
      isFeatured: false,
      tags: { connect: [{ slug: "new-arrival" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/headphones_a_1.webp`, alt: "Sport Headphones view 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/headphones_a_2.webp`, alt: "Sport Headphones view 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/headphones_a_3.webp`, alt: "Sport Headphones view 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/headphones_a_4.webp`, alt: "Sport Headphones view 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "HEAD-SPORT-BLK", color: "Black", condition: "NEW", stock: 20, price: 55000, weight: 0.15 },
          { sku: "HEAD-SPORT-BLU", color: "Blue", condition: "NEW", stock: 16, price: 55000, weight: 0.15 },
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
      name: "Gaming Headset",
      description: "Wireless gaming headset with 7.1 surround sound and detachable microphone.",
      basePrice: 185000,
      currency: "XAF",
      categoryId: ecouteurs.id,
      brand: "Gaming Gear",
      metaTitle: "Gaming Headset - Buy Online | The Eye Informatique",
      metaDescription: "Wireless gaming headset in Cameroon - immersive experience.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "best-seller" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/headphones_b_1.webp`, alt: "Gaming Headset view 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/headphones_b_2.webp`, alt: "Gaming Headset view 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/headphones_b_3.webp`, alt: "Gaming Headset view 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/headphones_b_4.webp`, alt: "Gaming Headset view 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "HEAD-GAME-BLK", color: "Black", condition: "NEW", stock: 14, price: 185000, weight: 0.32 },
          { sku: "HEAD-GAME-RED", color: "Black & Red", condition: "NEW", stock: 11, price: 185000, weight: 0.32 },
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
      name: "Studio Headphones",
      description: "Professional monitoring headphones for recording studio and audio production.",
      basePrice: 275000,
      currency: "XAF",
      categoryId: ecouteurs.id,
      brand: "Pro Audio",
      metaTitle: "Studio Headphones - Buy Online | The Eye Informatique",
      metaDescription: "Professional studio headphones in Cameroon.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "best-seller" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/headphones_c_1.webp`, alt: "Studio Headphones view 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/headphones_c_2.webp`, alt: "Studio Headphones view 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/headphones_c_3.webp`, alt: "Studio Headphones view 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/headphones_c_4.webp`, alt: "Studio Headphones view 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "HEAD-STUDIO-WHT", color: "White", condition: "NEW", stock: 9, price: 275000, weight: 0.25 },
          { sku: "HEAD-STUDIO-GRY", color: "Gray", condition: "NEW", stock: 7, price: 275000, weight: 0.25 },
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
      name: "Portable Speaker",
      description: "Portable Bluetooth speaker with RGB LED and long-lasting battery.",
      basePrice: 95000,
      currency: "XAF",
      categoryId: hautParleurs.id,
      brand: "Portable Sound",
      metaTitle: "Portable Speaker - Buy Online | The Eye Informatique",
      metaDescription: "Portable Bluetooth speaker in Cameroon with RGB LED.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "new-arrival" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/speaker1.webp`, alt: "Portable Speaker view 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/speaker2.webp`, alt: "Portable Speaker view 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/speaker3.webp`, alt: "Portable Speaker view 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/speaker4.webp`, alt: "Portable Speaker view 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "SPEAK-PORT-BLK", color: "Black", condition: "NEW", stock: 22, price: 95000, weight: 0.58 },
          { sku: "SPEAK-PORT-BLU", color: "Blue", condition: "NEW", stock: 18, price: 95000, weight: 0.58 },
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
      name: "Fitness Smartwatch",
      description: "Smartwatch with heart rate monitoring, step counter and notifications.",
      basePrice: 75000,
      currency: "XAF",
      categoryId: accessoires.id,
      brand: "Fitness Tech",
      metaTitle: "Fitness Smartwatch - Buy Online | The Eye Informatique",
      metaDescription: "Affordable fitness smartwatch in Cameroon - complete health tracking.",
      isActive: true,
      isFeatured: true,
      tags: { connect: [{ slug: "new-arrival" }, { slug: "best-seller" }] },
      images: {
        create: [
          { url: `${baseAssetUrl}/watch_1.webp`, alt: "Fitness Smartwatch view 1", isPrimary: true, sortOrder: 0 },
          { url: `${baseAssetUrl}/watch_2.webp`, alt: "Fitness Smartwatch view 2", isPrimary: false, sortOrder: 1 },
          { url: `${baseAssetUrl}/watch_3.webp`, alt: "Fitness Smartwatch view 3", isPrimary: false, sortOrder: 2 },
          { url: `${baseAssetUrl}/watch_4.webp`, alt: "Fitness Smartwatch view 4", isPrimary: false, sortOrder: 3 },
        ],
      },
      variants: {
        create: [
          { sku: "WATCH-FIT-BLK", color: "Black", condition: "NEW", stock: 26, price: 75000, weight: 0.042 },
          { sku: "WATCH-FIT-BLU", color: "Blue", condition: "NEW", stock: 19, price: 75000, weight: 0.042 },
          { sku: "WATCH-FIT-RED", color: "Red", condition: "NEW", stock: 15, price: 75000, weight: 0.042 },
        ],
      },
    },
    include: { variants: true },
  })

  console.log("  ✔ Products")

  // -------------------------------------------------------------------------
  // 5b. ProductFeatureValues — structured attributes for seeded products
  // -------------------------------------------------------------------------

  // Samsung Galaxy A55 5G
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: samsung.id, featureFieldId: "ff-and-screen" } }, update: {}, create: { productId: samsung.id, featureFieldId: "ff-and-screen", value: "6.6\"" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: samsung.id, featureFieldId: "ff-and-ram" } }, update: {}, create: { productId: samsung.id, featureFieldId: "ff-and-ram", value: "8GB" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: samsung.id, featureFieldId: "ff-and-storage" } }, update: {}, create: { productId: samsung.id, featureFieldId: "ff-and-storage", value: "128GB" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: samsung.id, featureFieldId: "ff-and-battery" } }, update: {}, create: { productId: samsung.id, featureFieldId: "ff-and-battery", value: "5000 mAh" } })

  // Apple MacBook Air M2
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: macbook.id, featureFieldId: "ff-lap-cpu" } }, update: {}, create: { productId: macbook.id, featureFieldId: "ff-lap-cpu", value: "Apple M2" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: macbook.id, featureFieldId: "ff-lap-ram" } }, update: {}, create: { productId: macbook.id, featureFieldId: "ff-lap-ram", value: "8GB" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: macbook.id, featureFieldId: "ff-lap-storage" } }, update: {}, create: { productId: macbook.id, featureFieldId: "ff-lap-storage", value: "256GB" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: macbook.id, featureFieldId: "ff-lap-display" } }, update: {}, create: { productId: macbook.id, featureFieldId: "ff-lap-display", value: "13.6\"" } })

  // Apple AirPods Pro 2nd Generation
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: airpods.id, featureFieldId: "ff-ecu-conn" } }, update: {}, create: { productId: airpods.id, featureFieldId: "ff-ecu-conn", value: "Bluetooth" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: airpods.id, featureFieldId: "ff-ecu-nc" } }, update: {}, create: { productId: airpods.id, featureFieldId: "ff-ecu-nc", value: "Yes" } })

  // Standard Earphones
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: earphones_b.id, featureFieldId: "ff-ecu-conn" } }, update: {}, create: { productId: earphones_b.id, featureFieldId: "ff-ecu-conn", value: "Wired" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: earphones_b.id, featureFieldId: "ff-ecu-nc" } }, update: {}, create: { productId: earphones_b.id, featureFieldId: "ff-ecu-nc", value: "No" } })

  // Premium Earphones
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: earphones_c.id, featureFieldId: "ff-ecu-conn" } }, update: {}, create: { productId: earphones_c.id, featureFieldId: "ff-ecu-conn", value: "Bluetooth" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: earphones_c.id, featureFieldId: "ff-ecu-nc" } }, update: {}, create: { productId: earphones_c.id, featureFieldId: "ff-ecu-nc", value: "Yes" } })

  // Sport Headphones
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: headphones_a.id, featureFieldId: "ff-ecu-conn" } }, update: {}, create: { productId: headphones_a.id, featureFieldId: "ff-ecu-conn", value: "Wired" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: headphones_a.id, featureFieldId: "ff-ecu-nc" } }, update: {}, create: { productId: headphones_a.id, featureFieldId: "ff-ecu-nc", value: "No" } })

  // Gaming Headset
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: headphones_b.id, featureFieldId: "ff-ecu-conn" } }, update: {}, create: { productId: headphones_b.id, featureFieldId: "ff-ecu-conn", value: "Bluetooth" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: headphones_b.id, featureFieldId: "ff-ecu-nc" } }, update: {}, create: { productId: headphones_b.id, featureFieldId: "ff-ecu-nc", value: "No" } })

  // Studio Headphones
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: headphones_c.id, featureFieldId: "ff-ecu-conn" } }, update: {}, create: { productId: headphones_c.id, featureFieldId: "ff-ecu-conn", value: "Wired" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: headphones_c.id, featureFieldId: "ff-ecu-nc" } }, update: {}, create: { productId: headphones_c.id, featureFieldId: "ff-ecu-nc", value: "No" } })

  // Portable Speaker
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: speaker.id, featureFieldId: "ff-hp-conn" } }, update: {}, create: { productId: speaker.id, featureFieldId: "ff-hp-conn", value: "Bluetooth" } })
  await db.productFeatureValue.upsert({ where: { productId_featureFieldId: { productId: speaker.id, featureFieldId: "ff-hp-battery" } }, update: {}, create: { productId: speaker.id, featureFieldId: "ff-hp-battery", value: "12 hours" } })

  console.log("  ✔ Feature Values")

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
    // Split roughly 40% Yaoundé / 35% Douala / 25% Bamenda
    const ydeStock = Math.round(totalStock * 0.4)
    const dlaStock = Math.round(totalStock * 0.35)
    const bdaStock = totalStock - ydeStock - dlaStock

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
    await db.productStockByBranch.upsert({
      where: { variantId_branchId: { variantId: variant.id, branchId: bamenda.id } },
      update: {},
      create: { variantId: variant.id, branchId: bamenda.id, stock: bdaStock, lowStockThreshold: 3 },
    })
  }

  console.log("  ✔ ProductStockByBranch")

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n✅  Seed complete!")
  console.log("   Branches :", [yaoundeBranch.name, douala.name, bamenda.name].join(", "))
  console.log("   Products :", 10, "products seeded with feature values")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
