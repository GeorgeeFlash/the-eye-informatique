import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Create default branches (idempotent via findFirst + create)
  let yaoundeBranch = await db.branch.findFirst({
    where: { name: "TEI Yaoundé - Siège" },
  })
  if (!yaoundeBranch) {
    yaoundeBranch = await db.branch.create({
      data: {
        name: "TEI Yaoundé - Siège",
        city: "Yaoundé",
        address: "Avenue Kennedy, Centre-ville",
        phone: "+237 222 000 000",
        isActive: true,
      },
    })
  }

  let douala = await db.branch.findFirst({ where: { name: "TEI Douala" } })
  if (!douala) {
    douala = await db.branch.create({
      data: {
        name: "TEI Douala",
        city: "Douala",
        address: "Rue de la Joie, Akwa",
        phone: "+237 233 000 000",
        isActive: true,
      },
    })
  }

  // Create root categories
  const phones = await db.category.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: {
      name: "Smartphones",
      slug: "smartphones",
    },
  })

  const computers = await db.category.upsert({
    where: { slug: "ordinateurs" },
    update: {},
    create: {
      name: "Ordinateurs",
      slug: "ordinateurs",
    },
  })

  await db.category.upsert({
    where: { slug: "accessoires" },
    update: {},
    create: {
      name: "Accessoires",
      slug: "accessoires",
    },
  })

  // Create sub-categories
  await db.category.upsert({
    where: { slug: "smartphones-android" },
    update: {},
    create: {
      name: "Android",
      slug: "smartphones-android",
      parentId: phones.id,
    },
  })

  await db.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: {
      name: "Laptops",
      slug: "laptops",
      parentId: computers.id,
    },
  })

  // Create default settings
  await db.setting.upsert({
    where: { key: "commission_rate" },
    update: {},
    create: {
      key: "commission_rate",
      value: { rate: 3 },
    },
  })

  console.log("Seed complete:", {
    branches: [yaoundeBranch.name, douala.name],
    categories: ["Smartphones", "Ordinateurs", "Accessoires"],
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
