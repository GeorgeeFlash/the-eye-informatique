-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "skuTemplate" TEXT;

-- CreateTable
CREATE TABLE "CategoryVariantAxis" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoryVariantAxis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryVariantAxisValue" (
    "id" TEXT NOT NULL,
    "axisId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "priceDelta" DECIMAL(10,2) DEFAULT 0,

    CONSTRAINT "CategoryVariantAxisValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantOption" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "axisValueId" TEXT NOT NULL,

    CONSTRAINT "ProductVariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryVariantAxis_categoryId_idx" ON "CategoryVariantAxis"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryVariantAxisValue_axisId_idx" ON "CategoryVariantAxisValue"("axisId");

-- CreateIndex
CREATE INDEX "ProductVariantOption_variantId_idx" ON "ProductVariantOption"("variantId");

-- CreateIndex
CREATE INDEX "ProductVariantOption_axisValueId_idx" ON "ProductVariantOption"("axisValueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantOption_variantId_axisValueId_key" ON "ProductVariantOption"("variantId", "axisValueId");

-- AddForeignKey
ALTER TABLE "CategoryVariantAxis" ADD CONSTRAINT "CategoryVariantAxis_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryVariantAxisValue" ADD CONSTRAINT "CategoryVariantAxisValue_axisId_fkey" FOREIGN KEY ("axisId") REFERENCES "CategoryVariantAxis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_axisValueId_fkey" FOREIGN KEY ("axisValueId") REFERENCES "CategoryVariantAxisValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
