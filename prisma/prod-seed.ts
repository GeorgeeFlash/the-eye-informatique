// ---------------------------------------------------------------------------
// Production seed for The Eye Informatique
//
// Run with:    pnpm prisma:seed:prod
// Idempotent:  yes - safe to re-run.
// Assumes:     prisma/seed.ts has been run at least once (for categories, tags, branches except Buea).
// ---------------------------------------------------------------------------

import { db } from "@/server/db";
import { Prisma } from "@/lib/generated/prisma/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeOptions(existing: unknown, incoming: string[]): string[] {
  const list = Array.isArray(existing) ? (existing as string[]) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...list, ...incoming]) {
    const key = raw.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(raw.trim());
  }
  return out;
}

async function upsertFeatureField(args: {
  id: string;
  categoryId: string;
  name: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN";
  sortOrder: number;
  options?: string[];
  isRequired?: boolean;
}) {
  const existing = await db.categoryFeatureField.findUnique({
    where: { id: args.id },
  });
  if (existing) {
    const merged = args.options
      ? mergeOptions(existing.options, args.options)
      : (existing.options as string[] | null);
    const sameName = existing.name === args.name;
    const sameType = existing.type === args.type;
    const sameSort = existing.sortOrder === args.sortOrder;
    const sameReq = existing.isRequired === (args.isRequired ?? false);
    const sameOpts =
      JSON.stringify(merged ?? null) ===
      JSON.stringify(existing.options ?? null);
    if (sameName && sameType && sameSort && sameReq && sameOpts) return;
    await db.categoryFeatureField.update({
      where: { id: args.id },
      data: {
        name: args.name,
        type: args.type,
        sortOrder: args.sortOrder,
        isRequired: args.isRequired ?? false,
        options: (merged ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
    return;
  }
  await db.categoryFeatureField.create({
    data: {
      id: args.id,
      categoryId: args.categoryId,
      name: args.name,
      type: args.type,
      sortOrder: args.sortOrder,
      isRequired: args.isRequired ?? false,
      options:
        args.options && args.options.length > 0
          ? (args.options as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    },
  });
}

async function ensureBranch(args: {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  isActive?: boolean;
}) {
  const existing = await db.branch.findUnique({ where: { id: args.id } });
  if (existing) {
    console.log(`  · branch ${args.id} exists`);
    return existing;
  }
  return db.branch.create({
    data: {
      id: args.id,
      name: args.name,
      city: args.city,
      address: args.address,
      phone: args.phone,
      isActive: args.isActive ?? true,
    },
  });
}

async function ensureAxis(args: {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
}) {
  const existing = await db.categoryVariantAxis.findUnique({
    where: { id: args.id },
  });
  if (existing) return existing;
  return db.categoryVariantAxis.create({
    data: {
      id: args.id,
      categoryId: args.categoryId,
      name: args.name,
      sortOrder: args.sortOrder,
    },
  });
}

async function ensureAxisValue(args: {
  id: string;
  axisId: string;
  value: string;
  sortOrder: number;
  priceDelta: number;
}) {
  const existing = await db.categoryVariantAxisValue.findUnique({
    where: { id: args.id },
  });
  if (existing) return existing;
  return db.categoryVariantAxisValue.create({
    data: {
      id: args.id,
      axisId: args.axisId,
      value: args.value,
      sortOrder: args.sortOrder,
      priceDelta: args.priceDelta,
    },
  });
}

async function ensureTag(slug: string, name: string) {
  const existing = await db.tag.findUnique({ where: { slug } });
  if (existing) return existing;
  return db.tag.create({ data: { slug, name } });
}

// ---------------------------------------------------------------------------
// Variant axis price deltas (XAF) - calculated from the catalog price ladders
// ---------------------------------------------------------------------------

// RAM axis: deltas are cumulative from 4GB baseline.
const RAM_DELTAS: Record<string, number> = {
  "4GB": 0,
  "8GB": 15000,
  "16GB": 30000,
  "32GB": 60000,
  "64GB": 110000,
};

// Storage axis: deltas are cumulative from 64GB baseline.
const STORAGE_DELTAS: Record<string, number> = {
  "64GB": 0,
  "128GB": 10000,
  "256GB": 20000,
  "500GB": 15000,
  "512GB": 40000,
  "1TB": 75000,
  "2TB": 130000,
};

const RAM_VALUES = Object.keys(RAM_DELTAS);
const STORAGE_VALUES = Object.keys(STORAGE_DELTAS);

// ---------------------------------------------------------------------------
// Product catalog (18 laptops)
// ---------------------------------------------------------------------------

type VariantTier = {
  ram: string;
  storage: string;
  price: number;
  condition?: "NEW" | "REFURBISHED";
};
type FeatureVal = { id: string; value: string };
type ProductSeed = {
  slug: string;
  name: string;
  brand: string;
  description: string;
  basePrice: number;
  categorySlug: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  features: FeatureVal[];
  variants: VariantTier[];
  imageBg: string;
  imageLabel: string;
};

const PRODUCTS: ProductSeed[] = [
  // 1
  {
    slug: "prod-lenovo-thinkpad-x1-carbon-i5-7th",
    name: "Lenovo ThinkPad X1 Carbon (Core i5 7th Gen)",
    brand: "Lenovo",
    description:
      'Intel Core i5 7th Generation Processor. 14" Full HD Display. Intel HD Graphics 620. 8GB RAM. 256GB SSD Storage, upgradable. Backlit Keyboard. Wi-Fi & Bluetooth Connectivity. USB Type-C & USB Connectivity. Premium Carbon-Fiber Reinforced Build. Slim, Lightweight & Portable Design. Ideal for Business, Office Work, Students, Programming, Browsing & Everyday Productivity.',
    basePrice: 125000,
    categorySlug: "laptops",
    tags: ["best-seller", "refurbished"],
    metaTitle: "Lenovo ThinkPad X1 Carbon - Buy Online | The Eye Informatique",
    metaDescription:
      "Lenovo ThinkPad X1 Carbon (i5 7th Gen) available in Cameroon. Warranty included.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5 (7th Gen)" },
      { id: "ff-lap-gen", value: "7th" },
      { id: "ff-lap-display", value: '14"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel HD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR3" },
      { id: "ff-lap-rammax", value: "16GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "Yes" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB Type-C, USB, HDMI" },
      {
        id: "ff-lap-ideal",
        value:
          "Business, Office, Students, Programming, Browsing, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "256GB", price: 125000 },
      { ram: "8GB", storage: "512GB", price: 145000 },
      { ram: "8GB", storage: "256GB", price: 95000, condition: "REFURBISHED" },
    ],
    imageBg: "0a0a23",
    imageLabel: "ThinkPad+X1+Carbon",
  },
  // 2
  {
    slug: "prod-dell-latitude-5310-i5-10th",
    name: "Dell Latitude 5310 (Core i5 10th Gen)",
    brand: "Dell",
    description:
      "Intel Core i5-1045G7 (10th Gen), 2.60GHz up to 4.20GHz Turbo, 4 cores, 8MB Cache. 16GB DDR4 3200MHz RAM (Upgradeable to 32GB). 256GB SSD (Upgradeable to 1TB SSD). 14-inch FHD 1920x1080 screen. Intel Iris Xe Graphics with 8GB total graphics (128MB dedicated). Backlit Keyboard. Intel Wi-Fi 6 AX201 160MHz, Bluetooth. microSD card slot, Universal audio port, 2× USB 3.2 Gen 1 (one with PowerShare), HDMI 2.0, RJ-45 Ethernet, Wedge-shaped lock slot. Windows 11 Pro with Microsoft Office, Chrome, PDF reader, Firefox, VLC and other programs installed.",
    basePrice: 150000,
    categorySlug: "laptops",
    tags: ["new-arrival", "promo"],
    metaTitle: "Dell Latitude 5310 - Buy Online | The Eye Informatique",
    metaDescription: "Dell Latitude 5310 (i5 10th Gen) available in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5-1045G7" },
      { id: "ff-lap-gen", value: "10th" },
      { id: "ff-lap-bclk", value: "2.60 GHz" },
      { id: "ff-lap-turbo", value: "4.20 GHz" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '14"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel Iris Xe Graphics" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "32GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "Yes" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 6" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      {
        id: "ff-lap-ports",
        value: "2× USB 3.2, USB-C, HDMI 2.0, RJ-45, microSD",
      },
      {
        id: "ff-lap-ideal",
        value: "Business, Office, Programming, Students, Productivity",
      },
    ],
    variants: [
      { ram: "16GB", storage: "256GB", price: 150000 },
      { ram: "16GB", storage: "512GB", price: 170000 },
      { ram: "16GB", storage: "1TB", price: 200000 },
      { ram: "32GB", storage: "512GB", price: 200000 },
      { ram: "32GB", storage: "1TB", price: 230000 },
    ],
    imageBg: "003366",
    imageLabel: "Latitude+5310",
  },
  // 3
  {
    slug: "prod-dell-latitude-5300-x360-i7-8th",
    name: "Dell Latitude 5300 x360 (Core i7 8th Gen)",
    brand: "Dell",
    description:
      'Intel Core i7 8th Generation Processor. 13.3" Full HD Touchscreen Display. 360° Convertible x360 Design. Intel UHD Graphics 620. 8GB RAM Upgradeable. 256GB SSD Storage Upgradeable. Backlit Keyboard. USB Type-C, USB 3.1, HDMI & RJ-45 Ethernet Ports. Wi-Fi & Bluetooth Connectivity. Durable Business-Class Build. Ideal for Business, Office Work, Programming, Students & Everyday Productivity.',
    basePrice: 150000,
    categorySlug: "laptops",
    tags: [],
    metaTitle: "Dell Latitude 5300 x360 - Buy Online | The Eye Informatique",
    metaDescription: "Dell Latitude 5300 x360 (i7 8th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i7 (8th Gen)" },
      { id: "ff-lap-gen", value: "8th" },
      { id: "ff-lap-display", value: '13.3"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel UHD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "16GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "Yes" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "Yes" },
      { id: "ff-lap-convert", value: "Yes" },
      { id: "ff-lap-ports", value: "USB Type-C, USB 3.1, HDMI, RJ-45" },
      {
        id: "ff-lap-ideal",
        value: "Business, Office, Programming, Students, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "256GB", price: 150000 },
      { ram: "16GB", storage: "256GB", price: 165000 },
      { ram: "16GB", storage: "512GB", price: 190000 },
    ],
    imageBg: "1a1a2e",
    imageLabel: "Latitude+5300+x360",
  },
  // 4
  {
    slug: "prod-hp-laptop-14-i5-11th",
    name: "HP Laptop 14 (Core i5 11th Gen)",
    brand: "HP",
    description:
      'Intel Core i5 11th Generation Processor. 14" HD Display. Intel Iris Xe Graphics. 16GB DDR4 RAM. 256GB SSD Storage Upgradeable. Speed 2.40GHz up to 4.20GHz Turbo Boost. Wi-Fi & Bluetooth Connectivity. USB Type-C, USB & HDMI Connectivity. Compact & Lightweight Design. Ideal for Office Work, School, Programming, Browsing, Data Analysis & Everyday Productivity.',
    basePrice: 150000,
    categorySlug: "laptops",
    tags: ["new-arrival"],
    metaTitle: "HP Laptop 14 - Buy Online | The Eye Informatique",
    metaDescription: "HP Laptop 14 (i5 11th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5 (11th Gen)" },
      { id: "ff-lap-gen", value: "11th" },
      { id: "ff-lap-bclk", value: "2.40 GHz" },
      { id: "ff-lap-turbo", value: "4.20 GHz" },
      { id: "ff-lap-display", value: '14"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel Iris Xe Graphics" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "16GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB Type-C, USB, HDMI" },
      {
        id: "ff-lap-ideal",
        value:
          "Office, School, Programming, Browsing, Data Analysis, Productivity",
      },
    ],
    variants: [
      { ram: "16GB", storage: "256GB", price: 150000 },
      { ram: "16GB", storage: "512GB", price: 170000 },
    ],
    imageBg: "0096c8",
    imageLabel: "HP+Laptop+14",
  },
  // 5
  {
    slug: "prod-dell-latitude-5480-i7-7th",
    name: "Dell Latitude 5480 (Core i7 7th Gen)",
    brand: "Dell",
    description:
      'Intel Core i7 7th Generation (4 CPUs) ~2.81GHz, up to 3.40GHz Turbo Boost. 8GB/16GB DDR4 RAM (Upgradeable to 32GB). 256GB/512GB SSD (Upgradeable to 1TB SSD). Backlit Keyboard. 14.0" Display with Intel UHD Graphics 620 (8GB total graphics, 128MB dedicated). SIM card slot, Fingerprint sensor. Excellent battery. Windows 11 Pro installed (Windows 10 Pro also available). Microsoft Office and other programs installed. (Also covers Dell Latitude 7480 specs.)',
    basePrice: 130000,
    categorySlug: "laptops",
    tags: ["refurbished"],
    metaTitle: "Dell Latitude 5480 - Buy Online | The Eye Informatique",
    metaDescription: "Dell Latitude 5480 (i7 7th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i7 (7th Gen)" },
      { id: "ff-lap-gen", value: "7th" },
      { id: "ff-lap-bclk", value: "2.81 GHz" },
      { id: "ff-lap-turbo", value: "3.40 GHz" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '14.0"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel UHD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "32GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "Yes" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "Yes" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB, HDMI, RJ-45, SIM slot" },
      {
        id: "ff-lap-ideal",
        value: "Business, Office, Programming, Students, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "256GB", price: 130000 },
      { ram: "16GB", storage: "256GB", price: 140000 },
      { ram: "8GB", storage: "512GB", price: 150000 },
      { ram: "16GB", storage: "512GB", price: 160000 },
    ],
    imageBg: "16213e",
    imageLabel: "Latitude+5480",
  },
  // 6
  {
    slug: "prod-hp-probook-650-g5-i3-8th",
    name: "HP ProBook 650 G5 (Core i3 8th Gen)",
    brand: "HP",
    description:
      "Intel Core i3-8130U 8th Generation (4 CPUs) 2.2GHz, up to 3.40GHz Intel Turbo Boost. 8GB DDR4 RAM (Upgradeable to 16GB/32GB). 500GB HDD (or 256GB SSD) with two drive slots (Upgradeable to 1TB HDD + 1TB SSD). 15.6-inch 1920×1080 display. Standard keyboard with Numeric Keypad. Intel Dual Band Wireless-AC 3168 Wi-Fi with Bluetooth 4.2. HD webcam. Spill-resistant full-sized island-style keyboard. Ports: HDMI 1.4b, USB 3.1 Type-C, USB 2.0, 2× USB 3.1 Gen 1, VGA, RJ-45, AC power, Headphone/microphone combo, Multi-format digital media reader (SD/SDHC/SDXC).",
    basePrice: 115000,
    categorySlug: "laptops",
    tags: [],
    metaTitle: "HP ProBook 650 G5 - Buy Online | The Eye Informatique",
    metaDescription: "HP ProBook 650 G5 (i3 8th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i3-8130U" },
      { id: "ff-lap-gen", value: "8th" },
      { id: "ff-lap-bclk", value: "2.20 GHz" },
      { id: "ff-lap-turbo", value: "3.40 GHz" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '15.6"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel UHD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "32GB" },
      { id: "ff-lap-storagetype", value: "HDD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "Yes" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      {
        id: "ff-lap-ports",
        value: "HDMI, USB-C, 2× USB 3.1, USB 2.0, VGA, RJ-45, SD reader",
      },
      {
        id: "ff-lap-ideal",
        value: "Office, Business, Programming, School, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "500GB", price: 115000 },
      { ram: "8GB", storage: "256GB", price: 125000 },
      { ram: "16GB", storage: "500GB", price: 135000 },
      { ram: "16GB", storage: "1TB", price: 150000 },
    ],
    imageBg: "c0c0c0",
    imageLabel: "ProBook+650+G5",
  },
  // 7
  {
    slug: "prod-dell-latitude-e5550-i5-5th",
    name: "Dell Latitude E5550 Touchscreen (Core i5 5th Gen)",
    brand: "Dell",
    description:
      "Intel Core i5-5300U 5th Generation, dual-core, 2.3GHz base, up to 2.9GHz Turbo. 15.6-inch HD 1366×768 or FHD 1920×1080 display. 4GB/8GB DDR3L RAM (Expandable to 16GB). 500GB HDD. Intel HD Graphics 5500. Approx. 4 hours battery life. Ports: USB-A, HDMI, DisplayPort, headphone jack, RJ-45 Ethernet. Windows 10 Pro.",
    basePrice: 85000,
    categorySlug: "laptops",
    tags: ["refurbished"],
    metaTitle: "Dell Latitude E5550 - Buy Online | The Eye Informatique",
    metaDescription: "Dell Latitude E5550 (i5 5th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5-5300U" },
      { id: "ff-lap-gen", value: "5th" },
      { id: "ff-lap-bclk", value: "2.30 GHz" },
      { id: "ff-lap-turbo", value: "2.90 GHz" },
      { id: "ff-lap-cores", value: "2" },
      { id: "ff-lap-display", value: '15.6"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel HD Graphics 5500" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR3L" },
      { id: "ff-lap-rammax", value: "16GB" },
      { id: "ff-lap-storagetype", value: "HDD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "Yes" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "Yes" },
      { id: "ff-lap-touch", value: "Yes" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB-A, HDMI, DisplayPort, RJ-45" },
      { id: "ff-lap-battery", value: "Approx. 4 hours" },
      { id: "ff-lap-ideal", value: "Office, Business, Browsing, Productivity" },
    ],
    variants: [
      { ram: "4GB", storage: "128GB", price: 85000 },
      { ram: "4GB", storage: "500GB", price: 85000 },
      { ram: "8GB", storage: "500GB", price: 95000 },
    ],
    imageBg: "2d2d2d",
    imageLabel: "Latitude+E5550",
  },
  // 8
  {
    slug: "prod-dell-latitude-5400-i5-8th",
    name: "Dell Latitude 5400 (Core i5 8th Gen)",
    brand: "Dell",
    description:
      "Intel Core i5 8th Generation (8 CPUs) ~1.80GHz, up to 3.90GHz Turbo Boost. 16GB DDR4 RAM (Upgradeable to 32GB). 256GB or 512GB SSD (Upgradeable to 1TB SSD). 14.0-inch 1920×1080 FHD IPS Display with Intel UHD Graphics 620 (8GB total graphics, 128MB dedicated). Excellent battery. Windows 11 Pro installed (Windows 10 Pro also available). Microsoft Office 2016/2013/2010 available.",
    basePrice: 120000,
    categorySlug: "laptops",
    tags: ["promo"],
    metaTitle: "Dell Latitude 5400 - Buy Online | The Eye Informatique",
    metaDescription: "Dell Latitude 5400 (i5 8th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5 (8th Gen)" },
      { id: "ff-lap-gen", value: "8th" },
      { id: "ff-lap-bclk", value: "1.80 GHz" },
      { id: "ff-lap-turbo", value: "3.90 GHz" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '14.0"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel UHD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "32GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB, USB-C, HDMI, RJ-45" },
      {
        id: "ff-lap-ideal",
        value: "Business, Office, Programming, Students, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "256GB", price: 120000 },
      { ram: "16GB", storage: "256GB", price: 130000 },
      { ram: "16GB", storage: "512GB", price: 150000 },
      { ram: "16GB", storage: "1TB", price: 170000 },
    ],
    imageBg: "0077b6",
    imageLabel: "Latitude+5400",
  },
  // 9
  {
    slug: "prod-hp-probook-645-g4-ryzen3",
    name: "HP ProBook 645 G4 (Ryzen 3)",
    brand: "HP",
    description:
      "AMD Ryzen 3 Pro 2300U with Radeon Vega Mobile GFX, 2000MHz, 4 cores, 4 logical processors. 8th Generation. AMD Radeon Vega 6 graphics, 4.5GB total graphics (1GB dedicated). 8GB DDR4 (Upgradeable to 32GB). 500GB HDD (Upgradeable to 1TB/2TB). Three USB 3.1 Gen 1, one USB Gen 1 Type-C (Thunderbolt 3, Power Delivery, DisplayPort), HDMI 1.4, VGA, microSD. Excellent battery. Windows 10 Pro or Windows 11 Pro.",
    basePrice: 120000,
    categorySlug: "laptops",
    tags: [],
    metaTitle: "HP ProBook 645 G4 - Buy Online | The Eye Informatique",
    metaDescription: "HP ProBook 645 G4 (Ryzen 3) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "AMD Ryzen 3 Pro 2300U" },
      { id: "ff-lap-gen", value: "Ryzen (AMD)" },
      { id: "ff-lap-bclk", value: "2.00 GHz" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '14.0"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "AMD Radeon Vega 6" },
      { id: "ff-lap-vram", value: "1GB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "32GB" },
      { id: "ff-lap-storagetype", value: "HDD" },
      { id: "ff-lap-storagemax", value: "2TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "Yes" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      {
        id: "ff-lap-ports",
        value: "3× USB 3.1, USB-C (Thunderbolt 3), HDMI, VGA, microSD",
      },
      {
        id: "ff-lap-ideal",
        value: "Office, Business, Browsing, Programming, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "500GB", price: 120000 },
      { ram: "16GB", storage: "500GB", price: 135000 },
      { ram: "8GB", storage: "1TB", price: 140000 },
      { ram: "8GB", storage: "256GB", price: 130000 },
      { ram: "16GB", storage: "256GB", price: 145000 },
      { ram: "8GB", storage: "512GB", price: 150000 },
      { ram: "16GB", storage: "512GB", price: 160000 },
    ],
    imageBg: "8a4fff",
    imageLabel: "ProBook+645+G4",
  },
  // 10
  {
    slug: "prod-hp-probook-440-g5-i3-7th",
    name: "HP ProBook 440 G5 Touchscreen (Core i3 7th Gen)",
    brand: "HP",
    description:
      "Intel Core i3-7130U (2 cores, 2.7GHz base). 8GB RAM. 256GB SSD. 14-inch HD 1366×768 Touchscreen. Intel HD Graphics 620. Approx. 4 hours battery. Wi-Fi 5, Bluetooth 4.2. USB 3.0, USB 2.0, HDMI, SD card reader. Windows 10 Pro.",
    basePrice: 100000,
    categorySlug: "laptops",
    tags: ["refurbished"],
    metaTitle: "HP ProBook 440 G5 Touch - Buy Online | The Eye Informatique",
    metaDescription: "HP ProBook 440 G5 Touch (i3 7th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i3-7130U" },
      { id: "ff-lap-gen", value: "7th" },
      { id: "ff-lap-bclk", value: "2.70 GHz" },
      { id: "ff-lap-cores", value: "2" },
      { id: "ff-lap-display", value: '14"' },
      { id: "ff-lap-res", value: "HD 1366x768" },
      { id: "ff-lap-gpu", value: "Intel HD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "16GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "Yes" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB 3.0, USB 2.0, HDMI, SD card reader" },
      { id: "ff-lap-battery", value: "Approx. 4 hours" },
      { id: "ff-lap-ideal", value: "Office, School, Browsing, Productivity" },
    ],
    variants: [
      { ram: "4GB", storage: "128GB", price: 100000 },
      { ram: "8GB", storage: "128GB", price: 110000 },
      { ram: "8GB", storage: "256GB", price: 120000 },
      { ram: "8GB", storage: "512GB", price: 140000 },
      { ram: "8GB", storage: "1TB", price: 170000 },
      { ram: "16GB", storage: "256GB", price: 140000 },
      { ram: "16GB", storage: "512GB", price: 160000 },
      { ram: "16GB", storage: "1TB", price: 200000 },
    ],
    imageBg: "555555",
    imageLabel: "ProBook+440+G5",
  },
  // 11
  {
    slug: "prod-lenovo-thinkpad-yoga-11e-i5-7th",
    name: "Lenovo ThinkPad Yoga 11e (Core i5 7th Gen)",
    brand: "Lenovo",
    description:
      "Intel Core i5 processor 4 CPUs × 1.60GHz, up to 3.20GHz × 4 CPUs Turbo Boost. 7th Generation. 8GB RAM. 128GB/256GB SSD (Upgradable to 512GB/1TB SSD). Touchscreen. x360, 2-in-1. 11.6-inch display. Integrated Intel HD 620 graphics, 4GB total graphics (128MB dedicated), 1366×768 resolution. HD Camera. Wi-Fi & Bluetooth. Excellent battery. 2 USB ports, HDMI, Micro SD Card Reader. Windows 10 Pro with Microsoft Office and other basic programs installed.",
    basePrice: 85000,
    categorySlug: "laptops",
    tags: [],
    metaTitle: "Lenovo ThinkPad Yoga 11e - Buy Online | The Eye Informatique",
    metaDescription: "Lenovo ThinkPad Yoga 11e (i5 7th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5 (7th Gen)" },
      { id: "ff-lap-gen", value: "7th" },
      { id: "ff-lap-bclk", value: "1.60 GHz" },
      { id: "ff-lap-turbo", value: "3.20 GHz" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '11.6"' },
      { id: "ff-lap-res", value: "HD 1366x768" },
      { id: "ff-lap-gpu", value: "Intel HD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR3" },
      { id: "ff-lap-rammax", value: "8GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "Yes" },
      { id: "ff-lap-convert", value: "Yes" },
      { id: "ff-lap-ports", value: "2× USB, HDMI, Micro SD" },
      {
        id: "ff-lap-ideal",
        value: "Students, School, Browsing, Office, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "128GB", price: 85000 },
      { ram: "8GB", storage: "256GB", price: 95000 },
    ],
    imageBg: "0a3d62",
    imageLabel: "ThinkPad+Yoga+11e",
  },
  // 12
  {
    slug: "prod-lenovo-thinkpad-e470-i5-7th",
    name: "Lenovo ThinkPad E470 (Core i5 7th Gen)",
    brand: "Lenovo",
    description:
      "Intel Core i5-7200U, 7th Generation, 2.5GHz up to 3.1GHz. 8GB DDR4 RAM. 500GB HDD. 14-inch HD/FHD display. Intel HD Graphics 620. Windows 10. Ports: USB 3.0, USB 2.0, HDMI, Ethernet (RJ-45), Audio jack. Wi-Fi and Bluetooth. 4-in-1 card reader.",
    basePrice: 90000,
    categorySlug: "laptops",
    tags: [],
    metaTitle: "Lenovo ThinkPad E470 - Buy Online | The Eye Informatique",
    metaDescription: "Lenovo ThinkPad E470 (i5 7th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5-7200U" },
      { id: "ff-lap-gen", value: "7th" },
      { id: "ff-lap-bclk", value: "2.50 GHz" },
      { id: "ff-lap-turbo", value: "3.10 GHz" },
      { id: "ff-lap-cores", value: "2" },
      { id: "ff-lap-display", value: '14"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel HD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "16GB" },
      { id: "ff-lap-storagetype", value: "HDD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "Yes" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      {
        id: "ff-lap-ports",
        value: "USB 3.0, USB 2.0, HDMI, RJ-45, Audio jack, 4-in-1 card reader",
      },
      {
        id: "ff-lap-ideal",
        value: "Business, Office, School, Programming, Productivity",
      },
    ],
    variants: [
      { ram: "4GB", storage: "500GB", price: 90000 },
      { ram: "8GB", storage: "500GB", price: 95000 },
    ],
    imageBg: "1b1b3a",
    imageLabel: "ThinkPad+E470",
  },
  // 13
  {
    slug: "prod-dell-latitude-3380-i3-6th",
    name: "Dell Latitude 3380 (Core i3 6th Gen)",
    brand: "Dell",
    description:
      "Intel Core i3-6006U (2.4 CPUs), 6th Generation. 4GB/8GB DDR4 RAM. 500GB/1TB hard drive (or 256GB SSD). Intel UHD Graphics 520. 14.0-inch LED HD Screen. 3 USB ports (2× USB 3.0, 1× USB 2.0). Ethernet (LAN), HDMI, Micro SD card reader. Up to 6 hours battery. Bluetooth, webcam, Wi-Fi.",
    basePrice: 85000,
    categorySlug: "laptops",
    tags: ["best-seller"],
    metaTitle: "Dell Latitude 3380 - Buy Online | The Eye Informatique",
    metaDescription: "Dell Latitude 3380 (i3 6th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i3-6006U" },
      { id: "ff-lap-gen", value: "6th" },
      { id: "ff-lap-bclk", value: "2.00 GHz" },
      { id: "ff-lap-cores", value: "2" },
      { id: "ff-lap-display", value: '14.0"' },
      { id: "ff-lap-res", value: "HD 1366x768" },
      { id: "ff-lap-gpu", value: "Intel UHD Graphics 520" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "8GB" },
      { id: "ff-lap-storagetype", value: "HDD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "Yes" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      {
        id: "ff-lap-ports",
        value: "2× USB 3.0, USB 2.0, Ethernet, HDMI, Micro SD",
      },
      { id: "ff-lap-battery", value: "Up to 6 hours" },
      {
        id: "ff-lap-ideal",
        value: "School, Office, Browsing, Students, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "500GB", price: 85000 },
      { ram: "8GB", storage: "256GB", price: 90000 },
      { ram: "8GB", storage: "1TB", price: 110000 },
    ],
    imageBg: "0f3057",
    imageLabel: "Latitude+3380",
  },
  // 14
  {
    slug: "prod-hp-probook-450-g7-i5-10th",
    name: "HP ProBook 450 G7 (Core i5 10th Gen)",
    brand: "HP",
    description:
      "Intel Core i5 10th Generation Processor. 15.6-inch Full HD Display. Intel UHD Graphics. 8GB RAM Upgradeable. 256GB SSD Storage Upgradeable. Backlit Keyboard. Wi-Fi & Bluetooth Connectivity. USB Type-C, USB, HDMI & RJ-45 Ethernet Ports. Premium Business-Class Build. Fingerprint Reader (Configuration Dependent). Ideal for Office Work, Business, Programming, School, Browsing & Everyday Productivity.",
    basePrice: 140000,
    categorySlug: "laptops",
    tags: ["new-arrival"],
    metaTitle: "HP ProBook 450 G7 - Buy Online | The Eye Informatique",
    metaDescription: "HP ProBook 450 G7 (i5 10th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5 (10th Gen)" },
      { id: "ff-lap-gen", value: "10th" },
      { id: "ff-lap-display", value: '15.6"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel UHD Graphics" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "32GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "Yes" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "Yes" },
      { id: "ff-lap-numpad", value: "Yes" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB Type-C, USB, HDMI, RJ-45" },
      {
        id: "ff-lap-ideal",
        value: "Office, Business, Programming, School, Browsing, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "256GB", price: 140000 },
      { ram: "8GB", storage: "512GB", price: 160000 },
      { ram: "16GB", storage: "256GB", price: 155000 },
      { ram: "16GB", storage: "512GB", price: 170000 },
    ],
    imageBg: "005f73",
    imageLabel: "ProBook+450+G7",
  },
  // 15
  {
    slug: "prod-lenovo-thinkpad-100w",
    name: "Lenovo ThinkPad 100w (AMD Quad-Core)",
    brand: "Lenovo",
    description:
      "Quad-Core Processor. 11.6-inch HD Display. AMD Radeon Graphics (512MB dedicated). 64GB SSD Storage. 4GB RAM. Wi-Fi & Bluetooth Connectivity. Durable ThinkPad Design. Compact & Lightweight Build. Comfortable ThinkPad Keyboard. Ideal for Students, Online Classes, Office Work, Browsing & Everyday Use.",
    basePrice: 50000,
    categorySlug: "laptops",
    tags: ["new-arrival"],
    metaTitle: "Lenovo ThinkPad 100w - Buy Online | The Eye Informatique",
    metaDescription: "Lenovo ThinkPad 100w (AMD Quad-Core) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "AMD Quad-Core" },
      { id: "ff-lap-gen", value: "Ryzen (AMD)" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '11.6"' },
      { id: "ff-lap-res", value: "HD 1366x768" },
      { id: "ff-lap-gpu", value: "AMD Radeon Graphics" },
      { id: "ff-lap-vram", value: "512MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "4GB" },
      { id: "ff-lap-storagetype", value: "SSD" },
      { id: "ff-lap-storagemax", value: "128GB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 10 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "Yes" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB, USB-C" },
      {
        id: "ff-lap-ideal",
        value: "Students, Online Classes, Office, Browsing",
      },
    ],
    variants: [{ ram: "4GB", storage: "64GB", price: 50000 }],
    imageBg: "003049",
    imageLabel: "ThinkPad+100w",
  },
  // 16
  {
    slug: "prod-dell-precision-7560-xeon",
    name: "Dell Precision 7560 Workstation (Intel Xeon W-11855M)",
    brand: "Dell",
    description:
      "Intel Xeon W-11855M 11th Gen, 3.2GHz base, up to 4.9GHz Turbo, 6-core 12-thread. NVIDIA T1200 4GB GDDR6 VRAM. 32GB DDR4 2666MHz (4 slots, upgradable to 64GB). 512GB NVMe SSD (3 additional free m.2/NVMe SSD slots, upgradable to 8TB total via 4 drives). 15.6-inch 1920×1080 FHD IPS slim-bezel display. Full keyboard with Numeric pad. Webcam, LAN, USB 3.1, Thunderbolt 3, Trackpoint, HDMI, Bluetooth, Fingerprint reader, Face unlock. Windows 11 Pro 64-bit (Windows 10 also compatible).",
    basePrice: 290000,
    categorySlug: "laptops",
    tags: ["promo"],
    metaTitle: "Dell Precision 7560 - Buy Online | The Eye Informatique",
    metaDescription: "Dell Precision 7560 Workstation (Xeon) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Xeon W-11855M" },
      { id: "ff-lap-gen", value: "11th" },
      { id: "ff-lap-bclk", value: "3.20 GHz" },
      { id: "ff-lap-turbo", value: "4.90 GHz" },
      { id: "ff-lap-cores", value: "6" },
      { id: "ff-lap-display", value: '15.6"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "NVIDIA T1200 4GB GDDR6" },
      { id: "ff-lap-vram", value: "4GB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "64GB" },
      { id: "ff-lap-storagetype", value: "NVMe" },
      { id: "ff-lap-storagemax", value: "8TB" },
      { id: "ff-lap-backlit", value: "Yes" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 6" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "Yes" },
      { id: "ff-lap-numpad", value: "Yes" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      {
        id: "ff-lap-ports",
        value: "USB 3.1, Thunderbolt 3, HDMI, LAN, Trackpoint",
      },
      {
        id: "ff-lap-ideal",
        value: "Workstation, Engineering, 3D Rendering, Programming, Business",
      },
    ],
    variants: [
      { ram: "16GB", storage: "512GB", price: 290000 },
      { ram: "32GB", storage: "512GB", price: 320000 },
      { ram: "32GB", storage: "1TB", price: 370000 },
      { ram: "64GB", storage: "1TB", price: 420000 },
    ],
    imageBg: "212529",
    imageLabel: "Precision+7560",
  },
  // 17
  {
    slug: "prod-hp-probook-640-g4-g5-i5-8th",
    name: "HP ProBook 640 G4/G5 (Core i5 8th Gen)",
    brand: "HP",
    description:
      "Intel Core i5-8350U 8th Gen (8 CPUs × 1.70GHz base), up to 4.10GHz Turbo Boost, 4 cores, 6MB L3 cache. 16GB RAM (Upgradeable to 32GB). 500GB HDD + 128GB SSD (2 hard drive slots, upgradable to 2TB HDD + 1TB SSD). Integrated Intel UHD Graphics 620 (8GB total graphics, 128MB dedicated). 14.0-inch display. MicroSD Media Card Reader. Webcam, Wi-Fi, Bluetooth 4.0. USB Type-C port.",
    basePrice: 120000,
    categorySlug: "laptops",
    tags: ["refurbished"],
    metaTitle: "HP ProBook 640 G4/G5 - Buy Online | The Eye Informatique",
    metaDescription: "HP ProBook 640 G4/G5 (i5 8th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i5-8350U" },
      { id: "ff-lap-gen", value: "8th" },
      { id: "ff-lap-bclk", value: "1.70 GHz" },
      { id: "ff-lap-turbo", value: "4.10 GHz" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '14.0"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel UHD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "32GB" },
      { id: "ff-lap-storagetype", value: "HDD + SSD" },
      { id: "ff-lap-storagemax", value: "2TB" },
      { id: "ff-lap-backlit", value: "No" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 5" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "Yes" },
      { id: "ff-lap-fp", value: "No" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "No" },
      { id: "ff-lap-convert", value: "No" },
      { id: "ff-lap-ports", value: "USB Type-C, USB, microSD" },
      {
        id: "ff-lap-ideal",
        value: "Office, Business, Programming, School, Productivity",
      },
    ],
    variants: [
      { ram: "8GB", storage: "500GB", price: 120000 },
      { ram: "8GB", storage: "256GB", price: 125000 },
      { ram: "8GB", storage: "1TB", price: 135000 },
      { ram: "16GB", storage: "500GB", price: 130000 },
      { ram: "16GB", storage: "256GB", price: 135000 },
      { ram: "16GB", storage: "512GB", price: 160000 },
    ],
    imageBg: "4a4e69",
    imageLabel: "ProBook+640+G5",
  },
  // 18
  {
    slug: "prod-lenovo-thinkpad-x390-i7-8th",
    name: "Lenovo ThinkPad X390 Touchscreen (Core i7 8th Gen)",
    brand: "Lenovo",
    description:
      "Intel Core i7-8550U 8th Gen, 4 cores, up to 4.0GHz boost. 16GB DDR4 2400MHz (soldered). Integrated Intel UHD 620 graphics. 13.3-inch FHD 1920×1080 IPS Touchscreen, anti-glare. 256GB/512GB PCIe NVMe SSD (Upgradeable). 57Wh battery, up to 8 hours mixed use, rapid-charge 65W. Ports: 2× Thunderbolt 3 (USB-C), USB-A 3.1, HDMI 2.0, microSD, combo audio jack. Wi-Fi 6 (802.11ax), Bluetooth 5.0, optional LTE/5G. Fingerprint reader, TPM 2.0, IR camera for facial login. Windows 11 Pro or Windows 10 Pro (Linux ready).",
    basePrice: 140000,
    categorySlug: "laptops",
    tags: ["promo"],
    metaTitle: "Lenovo ThinkPad X390 Touch - Buy Online | The Eye Informatique",
    metaDescription: "Lenovo ThinkPad X390 Touch (i7 8th Gen) in Cameroon.",
    features: [
      { id: "ff-lap-cpu", value: "Intel Core i7-8550U" },
      { id: "ff-lap-gen", value: "8th" },
      { id: "ff-lap-bclk", value: "1.80 GHz" },
      { id: "ff-lap-turbo", value: "4.00 GHz" },
      { id: "ff-lap-cores", value: "4" },
      { id: "ff-lap-display", value: '13.3"' },
      { id: "ff-lap-res", value: "FHD 1920x1080" },
      { id: "ff-lap-gpu", value: "Intel UHD Graphics 620" },
      { id: "ff-lap-vram", value: "128MB" },
      { id: "ff-lap-ramtype", value: "DDR4" },
      { id: "ff-lap-rammax", value: "16GB" },
      { id: "ff-lap-storagetype", value: "NVMe" },
      { id: "ff-lap-storagemax", value: "1TB" },
      { id: "ff-lap-backlit", value: "Yes" },
      { id: "ff-lap-os", value: "Windows 11 Pro" },
      { id: "ff-lap-wifi", value: "Wi-Fi 6" },
      { id: "ff-lap-bt", value: "Yes" },
      { id: "ff-lap-webcam", value: "HD" },
      { id: "ff-lap-fp", value: "Yes" },
      { id: "ff-lap-numpad", value: "No" },
      { id: "ff-lap-touch", value: "Yes" },
      { id: "ff-lap-convert", value: "No" },
      {
        id: "ff-lap-ports",
        value: "2× Thunderbolt 3, USB-A 3.1, HDMI 2.0, microSD, audio jack",
      },
      { id: "ff-lap-battery", value: "Up to 8 hours" },
      {
        id: "ff-lap-ideal",
        value: "Business, Office, Programming, Students, Productivity",
      },
    ],
    variants: [
      { ram: "16GB", storage: "256GB", price: 140000 },
      { ram: "16GB", storage: "512GB", price: 160000 },
    ],
    imageBg: "22223b",
    imageLabel: "ThinkPad+X390",
  },
];

// ---------------------------------------------------------------------------
// Feature field schema
// ---------------------------------------------------------------------------

type FeatureFieldDef = {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN";
  sortOrder: number;
  options?: string[];
};

const LAPTOP_FIELDS: FeatureFieldDef[] = [
  { id: "ff-lap-cpu", name: "Processor", type: "TEXT", sortOrder: 1 },
  {
    id: "ff-lap-gen",
    name: "Generation",
    type: "DROPDOWN",
    sortOrder: 2,
    options: [
      "5th",
      "6th",
      "7th",
      "8th",
      "10th",
      "11th",
      "12th",
      "13th",
      "Ryzen (AMD)",
    ],
  },
  { id: "ff-lap-bclk", name: "Base Clock Speed", type: "TEXT", sortOrder: 3 },
  { id: "ff-lap-turbo", name: "Turbo Boost Speed", type: "TEXT", sortOrder: 4 },
  {
    id: "ff-lap-cores",
    name: "Cores",
    type: "DROPDOWN",
    sortOrder: 5,
    options: ["2", "4", "6", "8"],
  },
  { id: "ff-lap-display", name: "Screen Size", type: "TEXT", sortOrder: 6 },
  {
    id: "ff-lap-res",
    name: "Display Resolution",
    type: "DROPDOWN",
    sortOrder: 7,
    options: [
      "HD 1366x768",
      "FHD 1920x1080",
      "QHD 2560x1440",
      "4K UHD 3840x2160",
    ],
  },
  { id: "ff-lap-gpu", name: "Graphics", type: "TEXT", sortOrder: 8 },
  {
    id: "ff-lap-vram",
    name: "Dedicated VRAM",
    type: "DROPDOWN",
    sortOrder: 9,
    options: ["128MB", "256MB", "512MB", "1GB", "2GB", "4GB", "8GB"],
  },
  {
    id: "ff-lap-ram",
    name: "RAM",
    type: "DROPDOWN",
    sortOrder: 10,
    options: ["4GB", "8GB", "16GB", "32GB", "64GB"],
  },
  {
    id: "ff-lap-ramtype",
    name: "RAM Type",
    type: "DROPDOWN",
    sortOrder: 11,
    options: ["DDR3", "DDR3L", "DDR4", "DDR5"],
  },
  {
    id: "ff-lap-rammax",
    name: "RAM Max (Upgradeable)",
    type: "DROPDOWN",
    sortOrder: 12,
    options: ["4GB", "8GB", "16GB", "32GB", "64GB"],
  },
  {
    id: "ff-lap-storage",
    name: "Storage",
    type: "DROPDOWN",
    sortOrder: 13,
    options: ["64GB", "128GB", "256GB", "500GB", "512GB", "1TB", "2TB", "8TB"],
  },
  {
    id: "ff-lap-storagetype",
    name: "Storage Type",
    type: "DROPDOWN",
    sortOrder: 14,
    options: ["HDD", "SSD", "HDD + SSD", "NVMe"],
  },
  {
    id: "ff-lap-storagemax",
    name: "Storage Max (Upgradeable)",
    type: "DROPDOWN",
    sortOrder: 15,
    options: ["128GB", "256GB", "512GB", "1TB", "2TB", "8TB"],
  },
  {
    id: "ff-lap-backlit",
    name: "Backlit Keyboard",
    type: "DROPDOWN",
    sortOrder: 16,
    options: ["Yes", "No"],
  },
  {
    id: "ff-lap-os",
    name: "Operating System",
    type: "DROPDOWN",
    sortOrder: 17,
    options: ["Windows 10 Pro", "Windows 11 Pro", "Linux-ready", "macOS"],
  },
  {
    id: "ff-lap-wifi",
    name: "Wi-Fi Standard",
    type: "DROPDOWN",
    sortOrder: 18,
    options: ["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E"],
  },
  {
    id: "ff-lap-bt",
    name: "Bluetooth",
    type: "DROPDOWN",
    sortOrder: 19,
    options: ["Yes", "No"],
  },
  {
    id: "ff-lap-webcam",
    name: "Webcam",
    type: "DROPDOWN",
    sortOrder: 20,
    options: ["Yes", "HD", "No"],
  },
  {
    id: "ff-lap-fp",
    name: "Fingerprint Sensor",
    type: "DROPDOWN",
    sortOrder: 21,
    options: ["Yes", "No"],
  },
  {
    id: "ff-lap-numpad",
    name: "Numeric Keypad",
    type: "DROPDOWN",
    sortOrder: 22,
    options: ["Yes", "No"],
  },
  {
    id: "ff-lap-touch",
    name: "Touchscreen",
    type: "DROPDOWN",
    sortOrder: 23,
    options: ["Yes", "No"],
  },
  {
    id: "ff-lap-convert",
    name: "Convertible / 2-in-1",
    type: "DROPDOWN",
    sortOrder: 24,
    options: ["Yes", "No"],
  },
  { id: "ff-lap-ports", name: "Ports", type: "TEXT", sortOrder: 25 },
  { id: "ff-lap-battery", name: "Battery Life", type: "TEXT", sortOrder: 26 },
  { id: "ff-lap-weight", name: "Weight", type: "TEXT", sortOrder: 27 },
  { id: "ff-lap-ideal", name: "Ideal For", type: "TEXT", sortOrder: 28 },
];

const DESKTOP_FIELDS: FeatureFieldDef[] = [
  { id: "ff-desk-cpu", name: "Processor", type: "TEXT", sortOrder: 1 },
  {
    id: "ff-desk-gen",
    name: "Generation",
    type: "DROPDOWN",
    sortOrder: 2,
    options: ["5th", "6th", "7th", "8th", "10th", "11th", "12th", "13th"],
  },
  {
    id: "ff-desk-ram",
    name: "RAM",
    type: "DROPDOWN",
    sortOrder: 3,
    options: ["4GB", "8GB", "16GB", "32GB", "64GB", "128GB"],
  },
  {
    id: "ff-desk-ramtype",
    name: "RAM Type",
    type: "DROPDOWN",
    sortOrder: 4,
    options: ["DDR3", "DDR4", "DDR5"],
  },
  {
    id: "ff-desk-storage",
    name: "Storage",
    type: "DROPDOWN",
    sortOrder: 5,
    options: ["256GB", "512GB", "1TB", "2TB"],
  },
  {
    id: "ff-desk-storagetype",
    name: "Storage Type",
    type: "DROPDOWN",
    sortOrder: 6,
    options: ["HDD", "SSD", "HDD + SSD", "NVMe"],
  },
  { id: "ff-desk-gpu", name: "Graphics", type: "TEXT", sortOrder: 7 },
  {
    id: "ff-desk-os",
    name: "Operating System",
    type: "DROPDOWN",
    sortOrder: 8,
    options: ["Windows 10 Pro", "Windows 11 Pro", "Linux-ready"],
  },
  {
    id: "ff-desk-wifi",
    name: "Wi-Fi",
    type: "DROPDOWN",
    sortOrder: 9,
    options: ["Wi-Fi 5", "Wi-Fi 6"],
  },
  {
    id: "ff-desk-bt",
    name: "Bluetooth",
    type: "DROPDOWN",
    sortOrder: 10,
    options: ["Yes", "No"],
  },
  { id: "ff-desk-ports", name: "Ports", type: "TEXT", sortOrder: 11 },
  {
    id: "ff-desk-formfactor",
    name: "Form Factor",
    type: "DROPDOWN",
    sortOrder: 12,
    options: ["Tower", "Small Form Factor", "Mini PC", "All-in-One"],
  },
];

const IPHONE_FIELDS: FeatureFieldDef[] = [
  { id: "ff-iph-screen", name: "Screen Size", type: "TEXT", sortOrder: 1 },
  {
    id: "ff-iph-ram",
    name: "RAM",
    type: "DROPDOWN",
    sortOrder: 2,
    options: ["4GB", "6GB", "8GB"],
  },
  {
    id: "ff-iph-storage",
    name: "Storage",
    type: "DROPDOWN",
    sortOrder: 3,
    options: ["64GB", "128GB", "256GB", "512GB", "1TB"],
  },
  { id: "ff-iph-battery", name: "Battery", type: "TEXT", sortOrder: 4 },
  { id: "ff-iph-chip", name: "Chip", type: "TEXT", sortOrder: 5 },
  { id: "ff-iph-os", name: "iOS Version", type: "TEXT", sortOrder: 6 },
  { id: "ff-iph-camera", name: "Camera", type: "TEXT", sortOrder: 7 },
  {
    id: "ff-iph-5g",
    name: "5G",
    type: "DROPDOWN",
    sortOrder: 8,
    options: ["Yes", "No"],
  },
];

const TABLET_FIELDS: FeatureFieldDef[] = [
  { id: "ff-tab-screen", name: "Screen Size", type: "TEXT", sortOrder: 1 },
  {
    id: "ff-tab-ram",
    name: "RAM",
    type: "DROPDOWN",
    sortOrder: 2,
    options: ["3GB", "4GB", "6GB", "8GB", "16GB"],
  },
  {
    id: "ff-tab-storage",
    name: "Storage",
    type: "DROPDOWN",
    sortOrder: 3,
    options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
  },
  { id: "ff-tab-battery", name: "Battery", type: "TEXT", sortOrder: 4 },
  {
    id: "ff-tab-cellular",
    name: "Cellular",
    type: "DROPDOWN",
    sortOrder: 5,
    options: ["Wi-Fi only", "Wi-Fi + Cellular"],
  },
  {
    id: "ff-tab-stylus",
    name: "Stylus Support",
    type: "DROPDOWN",
    sortOrder: 6,
    options: ["Yes", "No"],
  },
  {
    id: "ff-tab-os",
    name: "Operating System",
    type: "DROPDOWN",
    sortOrder: 7,
    options: ["iPadOS", "Android", "Windows"],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  Seeding production catalog…");

  // 1. Branches
  await ensureBranch({
    id: "branch-yaounde",
    name: "TEI Yaoundé",
    city: "Yaoundé",
    address: "Kennedy Avenue, City Center",
    phone: "+237 222 000 000",
  });
  await ensureBranch({
    id: "branch-douala",
    name: "TEI Douala",
    city: "Douala",
    address: "Joy Street, Akwa",
    phone: "+237 233 000 000",
  });
  await ensureBranch({
    id: "branch-bamenda",
    name: "TEI Bamenda - Head Office",
    city: "Bamenda",
    address: "Foncha Junction, Nkwen",
    phone: "+237 233 111 111",
  });
  await ensureBranch({
    id: "branch-buea",
    name: "TEI Buea",
    city: "Buea",
    address: "Mile 17 Motor Park",
    phone: "+237 233 222 222",
  });
  console.log("  ✔ Branches");

  // 2. Categories (bootstrap if missing — prod DB may be empty)
  async function ensureCategory(args: {
    slug: string;
    name: string;
    sortOrder: number;
    parentSlug?: string;
  }) {
    const existing = await db.category.findUnique({
      where: { slug: args.slug },
    });
    if (existing) return existing;
    const parentId = args.parentSlug
      ? ((await db.category.findUnique({ where: { slug: args.parentSlug } }))
          ?.id ?? null)
      : null;
    return db.category.create({
      data: {
        slug: args.slug,
        name: args.name,
        sortOrder: args.sortOrder,
        parentId,
      },
    });
  }

  // Top-level categories
  await ensureCategory({ slug: "computers", name: "Computers", sortOrder: 2 });
  await ensureCategory({
    slug: "smartphones",
    name: "Smartphones",
    sortOrder: 1,
  });
  await ensureCategory({
    slug: "accessories",
    name: "Accessories",
    sortOrder: 3,
  });
  await ensureCategory({ slug: "audio", name: "Audio", sortOrder: 4 });

  // Sub-categories used by this seed
  const laptopsCat = await ensureCategory({
    slug: "laptops",
    name: "Laptops",
    sortOrder: 1,
    parentSlug: "computers",
  });
  await ensureCategory({
    slug: "desktops",
    name: "Desktops",
    sortOrder: 2,
    parentSlug: "computers",
  });
  await ensureCategory({
    slug: "smartphones-iphone",
    name: "iPhone",
    sortOrder: 2,
    parentSlug: "smartphones",
  });
  await ensureCategory({
    slug: "tablets",
    name: "Tablets",
    sortOrder: 3,
    parentSlug: "smartphones",
  });

  // Refresh lookup map
  const categoryIds: Record<string, string> = {};
  for (const slug of ["laptops", "desktops", "smartphones-iphone", "tablets"]) {
    const cat = await db.category.findUnique({ where: { slug } });
    if (!cat) {
      console.error(`  ✘ Category "${slug}" could not be created.`);
      process.exit(1);
    }
    categoryIds[slug] = cat.id;
  }
  // Use laptopsCat variable to satisfy TS noUnused check
  void laptopsCat;

  // 3. Feature fields
  for (const f of LAPTOP_FIELDS) {
    await upsertFeatureField({
      id: f.id,
      categoryId: categoryIds.laptops!,
      name: f.name,
      type: f.type,
      sortOrder: f.sortOrder,
      options: f.options,
    });
  }
  for (const f of DESKTOP_FIELDS) {
    await upsertFeatureField({
      id: f.id,
      categoryId: categoryIds.desktops!,
      name: f.name,
      type: f.type,
      sortOrder: f.sortOrder,
      options: f.options,
    });
  }
  for (const f of IPHONE_FIELDS) {
    await upsertFeatureField({
      id: f.id,
      categoryId: categoryIds["smartphones-iphone"]!,
      name: f.name,
      type: f.type,
      sortOrder: f.sortOrder,
      options: f.options,
    });
  }
  for (const f of TABLET_FIELDS) {
    await upsertFeatureField({
      id: f.id,
      categoryId: categoryIds.tablets!,
      name: f.name,
      type: f.type,
      sortOrder: f.sortOrder,
      options: f.options,
    });
  }
  console.log("  ✔ Feature fields");

  // 4. Variant axes
  const ramAxis = await ensureAxis({
    id: "axis-lap-ram",
    categoryId: categoryIds.laptops!,
    name: "RAM",
    sortOrder: 1,
  });
  const storageAxis = await ensureAxis({
    id: "axis-lap-storage",
    categoryId: categoryIds.laptops!,
    name: "Storage",
    sortOrder: 2,
  });
  const ramValueIds: Record<string, string> = {};
  RAM_VALUES.forEach((v) => {
    ramValueIds[v] = `av-lap-ram-${v.toLowerCase()}`;
  });
  const storageValueIds: Record<string, string> = {};
  STORAGE_VALUES.forEach((v) => {
    storageValueIds[v] = `av-lap-storage-${v.toLowerCase()}`;
  });
  for (let i = 0; i < RAM_VALUES.length; i++) {
    const v = RAM_VALUES[i]!;
    await ensureAxisValue({
      id: ramValueIds[v]!,
      axisId: ramAxis.id,
      value: v,
      sortOrder: i,
      priceDelta: RAM_DELTAS[v] ?? 0,
    });
  }
  for (let i = 0; i < STORAGE_VALUES.length; i++) {
    const v = STORAGE_VALUES[i]!;
    await ensureAxisValue({
      id: storageValueIds[v]!,
      axisId: storageAxis.id,
      value: v,
      sortOrder: i,
      priceDelta: STORAGE_DELTAS[v] ?? 0,
    });
  }
  console.log("  ✔ Variant axes");

  // 5. Tags (ensure they exist; dev seed creates them but we don't depend on it)
  await ensureTag("refurbished", "Refurbished");
  await ensureTag("promo", "Promo");
  await ensureTag("best-seller", "Best Seller");
  await ensureTag("new-arrival", "New Arrival");
  console.log("  ✔ Tags");

  // 6. Products
  for (const p of PRODUCTS) {
    const categoryId = categoryIds[p.categorySlug]!;
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        brand: p.brand,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        isActive: true,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        currency: "XAF",
        categoryId,
        brand: p.brand,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        isActive: true,
        isFeatured: false,
      },
    });

    // Tags
    for (const tagSlug of p.tags) {
      const tag = await db.tag.findUnique({ where: { slug: tagSlug } });
      if (tag) {
        await db.product.update({
          where: { id: product.id },
          data: { tags: { connect: { id: tag.id } } },
        });
      }
    }

    // Images (idempotent: delete then recreate to keep it simple, low row count)
    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: [
        {
          productId: product.id,
          url: `https://placehold.co/800x800/${p.imageBg}/FFFFFF?text=${p.imageLabel}`,
          alt: p.name,
          isPrimary: true,
          sortOrder: 0,
        },
        {
          productId: product.id,
          url: `https://placehold.co/800x800/${p.imageBg}/FFFFFF?text=${p.imageLabel}+Side`,
          alt: `${p.name} side`,
          isPrimary: false,
          sortOrder: 1,
        },
      ],
    });

    // Variants
    for (const v of p.variants) {
      const condition = v.condition ?? "NEW";
      const sku = `PROD-${p.brand.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${p.slug
        .replace(/^prod-/, "")
        .toUpperCase()
        .split("-")
        .slice(0, 4)
        .join(
          "-",
        )}-${v.ram.replace("GB", "")}-${v.storage.replace("GB", "")}-${condition}`;
      const variant = await db.productVariant.upsert({
        where: { sku },
        update: {
          price: v.price,
          stock: 5,
          condition,
          color: null,
          weight: null,
        },
        create: {
          sku,
          productId: product.id,
          price: v.price,
          stock: 5,
          condition,
          color: null,
          weight: null,
        },
      });

      // Link to axis values
      const ramAxisValueId = ramValueIds[v.ram];
      const storageAxisValueId = storageValueIds[v.storage];
      if (ramAxisValueId) {
        await db.productVariantOption.upsert({
          where: {
            variantId_axisValueId: {
              variantId: variant.id,
              axisValueId: ramAxisValueId,
            },
          },
          update: {},
          create: { variantId: variant.id, axisValueId: ramAxisValueId },
        });
      }
      if (storageAxisValueId) {
        await db.productVariantOption.upsert({
          where: {
            variantId_axisValueId: {
              variantId: variant.id,
              axisValueId: storageAxisValueId,
            },
          },
          update: {},
          create: { variantId: variant.id, axisValueId: storageAxisValueId },
        });
      }

      // Branch stock (40/30/20/10 split, 5 total)
      const yde = 2;
      const dla = 2;
      const bda = 1;
      const bea = 0;
      const splits: Array<[string, number]> = [
        ["branch-yaounde", yde],
        ["branch-douala", dla],
        ["branch-bamenda", bda],
        ["branch-buea", bea],
      ];
      for (const [branchId, qty] of splits) {
        if (qty <= 0) continue;
        await db.productStockByBranch.upsert({
          where: { variantId_branchId: { variantId: variant.id, branchId } },
          update: {},
          create: {
            variantId: variant.id,
            branchId,
            stock: qty,
            lowStockThreshold: 3,
          },
        });
      }
    }

    // Feature values
    for (const fv of p.features) {
      // Skip if field doesn't exist for this category
      const field = await db.categoryFeatureField.findUnique({
        where: { id: fv.id },
      });
      if (!field) continue;
      await db.productFeatureValue.upsert({
        where: {
          productId_featureFieldId: {
            productId: product.id,
            featureFieldId: fv.id,
          },
        },
        update: { value: fv.value },
        create: {
          productId: product.id,
          featureFieldId: fv.id,
          value: fv.value,
        },
      });
    }
  }
  console.log(`  ✔ Products (${PRODUCTS.length})`);

  console.log("\n✅  Production seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
