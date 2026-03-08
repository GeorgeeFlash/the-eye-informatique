export const productFixtures = [
  {
    id: "prod-001",
    name: "Samsung Galaxy A55",
    slug: "samsung-galaxy-a55",
    brand: "Samsung",
    condition: "NEW" as const,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    variants: [
      {
        id: "var-001-128gb",
        productId: "prod-001",
        sku: "SAM-A55-128",
        label: "128 Go",
        price: 185000,
        stockQuantity: 10,
        branchId: "branch-001",
      },
      {
        id: "var-001-256gb",
        productId: "prod-001",
        sku: "SAM-A55-256",
        label: "256 Go",
        price: 220000,
        stockQuantity: 5,
        branchId: "branch-001",
      },
    ],
  },
  {
    id: "prod-002",
    name: "Laptop HP EliteBook 840",
    slug: "hp-elitebook-840",
    brand: "HP",
    condition: "REFURBISHED" as const,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    variants: [
      {
        id: "var-002-i5",
        productId: "prod-002",
        sku: "HP-840-I5",
        label: "Intel Core i5",
        price: 350000,
        stockQuantity: 3,
        branchId: "branch-001",
      },
    ],
  },
]

export const categoryFixtures = [
  { id: "cat-001", name: "Smartphones", slug: "smartphones", parentId: null },
  { id: "cat-002", name: "Ordinateurs", slug: "ordinateurs", parentId: null },
]

export const branchFixtures = [
  {
    id: "branch-001",
    name: "TEI Yaoundé - Siège",
    city: "Yaoundé",
    isActive: true,
  },
]
