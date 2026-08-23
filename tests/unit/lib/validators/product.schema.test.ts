import { productSchemaBase, productSchema, productVariantSchema } from "@/lib/validators/product.schema";

describe("product.schema", () => {
  describe("productSchemaBase", () => {
    it("accepts a valid slug", () => {
      const result = productSchemaBase.safeParse({
        name: "Test Product",
        slug: "test-product",
        basePrice: 1000,
        categoryId: "cat-1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid slug with uppercase", () => {
      const result = productSchemaBase.safeParse({
        name: "Test Product",
        slug: "Test-Product",
        basePrice: 1000,
        categoryId: "cat-1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an invalid slug with special characters", () => {
      const result = productSchemaBase.safeParse({
        name: "Test Product",
        slug: "test_product!",
        basePrice: 1000,
        categoryId: "cat-1",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("productSchema", () => {
    it("rejects commission percentage over 100", () => {
      const result = productSchema.safeParse({
        name: "Test Product",
        slug: "test-product",
        basePrice: 1000,
        categoryId: "cat-1",
        commissionType: "PERCENTAGE",
        commissionValue: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("productVariantSchema", () => {
    it("accepts variant with optional id", () => {
      const result = productVariantSchema.safeParse({
        id: "cl12345678901234567890123456789012",
        sku: "SKU-1",
        condition: "NEW",
        stock: 10,
        price: 1000,
      });
      expect(result.success).toBe(true);
    });

    it("accepts variant without id", () => {
      const result = productVariantSchema.safeParse({
        sku: "SKU-1",
        condition: "NEW",
        stock: 10,
        price: 1000,
      });
      expect(result.success).toBe(true);
    });
  });
});
