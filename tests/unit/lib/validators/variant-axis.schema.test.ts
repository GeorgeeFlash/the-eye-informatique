import { variantAxisSchema, axisValueSchema, skuTemplateSchema } from "@/lib/validators/variant-axis.schema";

describe("variant-axis.schema", () => {
  describe("variantAxisSchema", () => {
    it("accepts valid axis data", () => {
      const result = variantAxisSchema.safeParse({
        name: "RAM",
        sortOrder: 1,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = variantAxisSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name longer than 50 characters", () => {
      const result = variantAxisSchema.safeParse({ name: "a".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("rejects negative sortOrder", () => {
      const result = variantAxisSchema.safeParse({ name: "RAM", sortOrder: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe("axisValueSchema", () => {
    it("accepts valid value data", () => {
      const result = axisValueSchema.safeParse({
        value: "16GB",
        sortOrder: 0,
        priceDelta: 10000,
      });
      expect(result.success).toBe(true);
    });

    it("defaults priceDelta to 0", () => {
      const result = axisValueSchema.safeParse({ value: "16GB" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priceDelta).toBe(0);
      }
    });

    it("rejects empty value", () => {
      const result = axisValueSchema.safeParse({ value: "" });
      expect(result.success).toBe(false);
    });

    it("rejects value longer than 50 characters", () => {
      const result = axisValueSchema.safeParse({ value: "a".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("rejects negative sortOrder", () => {
      const result = axisValueSchema.safeParse({ value: "16GB", sortOrder: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe("skuTemplateSchema", () => {
    it("accepts optional template", () => {
      const result = skuTemplateSchema.safeParse("{product_slug}-{RAM}");
      expect(result.success).toBe(true);
    });

    it("accepts undefined", () => {
      const result = skuTemplateSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("rejects template longer than 200 characters", () => {
      const result = skuTemplateSchema.safeParse({ a: "a".repeat(201) });
      expect(result.success).toBe(false);
    });
  });
});
