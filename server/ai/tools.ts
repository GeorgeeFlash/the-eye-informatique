import { tool } from "ai"
import { z } from "zod/v3"
import { db } from "@/server/db"
import { Prisma } from "@/lib/generated/prisma/client"

// ---------------------------------------------------------------------------
// searchProducts — carefully engineered product search for Iris chat agent
// ---------------------------------------------------------------------------

export const searchProducts = tool({
  description:
    "Search the product catalog. Use when the customer asks about products, pricing, availability, or wants recommendations. " +
    "Supports keyword queries, optional category filtering, price range, and condition. " +
    "Returns the top 6 most relevant results with pricing, images, and stock info.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search keywords — product name, brand, type, or description terms. " +
        "Extract the most meaningful search terms from the customer message.",
      ),
    category: z
      .string()
      .optional()
      .describe("Category name to filter by (e.g. 'Laptops', 'Phones'). Only use when the customer explicitly mentions a category."),
    minPrice: z
      .number()
      .optional()
      .describe("Minimum price in XAF. Only use when the customer mentions a budget floor."),
    maxPrice: z
      .number()
      .optional()
      .describe("Maximum price in XAF. Only use when the customer mentions a budget ceiling."),
    condition: z
      .enum(["NEW", "REFURBISHED"])
      .optional()
      .describe("Product condition filter. Only use when the customer explicitly asks for new or refurbished items."),
  }),
  execute: async ({ query, category, minPrice, maxPrice, condition }) => {
    // Build Prisma where clause
    const where: Prisma.ProductWhereInput = { isActive: true }

    // Keyword search across name, brand, description
    const keywords = query
      .split(/\s+/)
      .filter((w) => w.length > 1)
    if (keywords.length > 0) {
      where.AND = keywords.map((kw) => ({
        OR: [
          { name: { contains: kw, mode: "insensitive" as const } },
          { brand: { contains: kw, mode: "insensitive" as const } },
          { description: { contains: kw, mode: "insensitive" as const } },
        ],
      }))
    }

    // Category filter (by name match)
    if (category) {
      const cat = await db.category.findFirst({
        where: { name: { contains: category, mode: "insensitive" } },
        select: { id: true },
      })
      if (cat) where.categoryId = cat.id
    }

    // Condition filter
    if (condition) {
      where.variants = { some: { condition } }
    }

    // Fetch more than we need so we can rank & filter by price
    const products = await db.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: {
          select: { price: true, stock: true, condition: true },
          orderBy: { price: "asc" },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 20,
    })

    // Post-query ranking & price filter
    const scored = products
      .map((p) => {
        const lowestPrice = p.variants.length
          ? Number(p.variants[0].price)
          : Number(p.basePrice)
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
        const queryLower = query.toLowerCase()
        const nameLower = p.name.toLowerCase()

        // Relevance scoring: name exact > name contains > brand > featured > in stock
        let score = 0
        if (nameLower === queryLower) score += 100
        else if (nameLower.includes(queryLower)) score += 50
        if (p.brand?.toLowerCase().includes(queryLower)) score += 30
        if (p.isFeatured) score += 10
        if (totalStock > 0) score += 20

        return { product: p, lowestPrice, totalStock, score }
      })
      .filter((item) => {
        if (minPrice && item.lowestPrice < minPrice) return false
        if (maxPrice && item.lowestPrice > maxPrice) return false
        return true
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    return scored.map(({ product: p, lowestPrice, totalStock }) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category.name,
      price: lowestPrice,
      currency: p.currency,
      imageUrl: p.images[0]?.url ?? null,
      inStock: totalStock > 0,
      condition: p.variants[0]?.condition ?? "NEW",
    }))
  },
})

// ---------------------------------------------------------------------------
// getProductDetails — full product info for a single product
// ---------------------------------------------------------------------------

export const getProductDetails = tool({
  description:
    "Get detailed information about a specific product by its slug. " +
    "Use when the customer wants to know more about a specific product you previously found, " +
    "or when they mention a product by name and need specs, variants, availability, or reviews.",
  inputSchema: z.object({
    slug: z.string().describe("The product slug (URL-friendly identifier)."),
  }),
  execute: async ({ slug }) => {
    const product = await db.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 4 },
        variants: {
          include: {
            stockByBranch: {
              include: { branch: { select: { name: true, city: true } } },
            },
          },
        },
        featureValues: { include: { featureField: true } },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { user: { select: { name: true } } },
        },
      },
    })

    if (!product) return { error: "Product not found." }

    // Review aggregate
    const agg = await db.productReview.aggregate({
      where: { productId: product.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true },
    })

    return {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category.name,
      description: product.description,
      basePrice: Number(product.basePrice),
      currency: product.currency,
      images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
      variants: product.variants.map((v) => ({
        sku: v.sku,
        color: v.color,
        condition: v.condition,
        price: Number(v.price),
        stock: v.stock,
        availability: v.stockByBranch.map((sb) => ({
          branch: sb.branch.name,
          city: sb.branch.city,
          stock: sb.stock,
        })),
      })),
      features: product.featureValues.map((fv) => ({
        name: fv.featureField.name,
        value: fv.value,
      })),
      rating: agg._avg.rating ? Number(agg._avg.rating) : null,
      reviewCount: agg._count.id,
      recentReviews: product.reviews.map((r) => ({
        author: r.user.name,
        rating: r.rating,
        comment: r.comment,
      })),
    }
  },
})

// ---------------------------------------------------------------------------
// navigateTo — guide the customer to a page on the platform
// ---------------------------------------------------------------------------

export const navigateTo = tool({
  description:
    "Generate a navigation link for the customer. Use when the customer wants to go to a specific page " +
    "like the product catalog, cart, contact page, about page, blog, or a specific product page. " +
    "Returns a URL path and label for the customer to click.",
  inputSchema: z.object({
    intent: z
      .enum([
        "products",
        "cart",
        "checkout",
        "contact",
        "about",
        "blog",
        "affiliate",
        "guarantee",
        "product_page",
      ])
      .describe("The navigation intent."),
    productSlug: z
      .string()
      .optional()
      .describe("Required only when intent is 'product_page'. The product slug to link to."),
  }),
  execute: async ({ intent, productSlug }) => {
    const routes: Record<string, { path: string; label: string }> = {
      products: { path: "/products", label: "Browse Products" },
      cart: { path: "/cart", label: "View Cart" },
      checkout: { path: "/checkout", label: "Checkout" },
      contact: { path: "/contact", label: "Contact Us" },
      about: { path: "/about", label: "About Us" },
      blog: { path: "/blog", label: "Our Blog" },
      affiliate: { path: "/affiliate", label: "Affiliate Program" },
      guarantee: { path: "/guarantee", label: "Guarantee Policy" },
    }

    if (intent === "product_page" && productSlug) {
      return { path: `/products/${productSlug}`, label: `View Product` }
    }

    return routes[intent] ?? { path: "/", label: "Home" }
  },
})

// ---------------------------------------------------------------------------
// Combined tools export for the Iris chat agent
// ---------------------------------------------------------------------------

export const irisChatTools = {
  searchProducts,
  getProductDetails,
  navigateTo,
}
