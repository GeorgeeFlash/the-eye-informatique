/*
  Warnings:

  - You are about to drop the column `specs` on the `Product` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FeatureFieldType" AS ENUM ('TEXT', 'NUMBER', 'DROPDOWN');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "specs",
ADD COLUMN     "commissionType" "CommissionType",
ADD COLUMN     "commissionValue" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "CategoryFeatureField" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FeatureFieldType" NOT NULL DEFAULT 'TEXT',
    "options" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CategoryFeatureField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFeatureValue" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "featureFieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ProductFeatureValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryFeatureField_categoryId_idx" ON "CategoryFeatureField"("categoryId");

-- CreateIndex
CREATE INDEX "ProductFeatureValue_featureFieldId_idx" ON "ProductFeatureValue"("featureFieldId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFeatureValue_productId_featureFieldId_key" ON "ProductFeatureValue"("productId", "featureFieldId");

-- AddForeignKey
ALTER TABLE "CategoryFeatureField" ADD CONSTRAINT "CategoryFeatureField_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeatureValue" ADD CONSTRAINT "ProductFeatureValue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeatureValue" ADD CONSTRAINT "ProductFeatureValue_featureFieldId_fkey" FOREIGN KEY ("featureFieldId") REFERENCES "CategoryFeatureField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
