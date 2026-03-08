/*
  Warnings:

  - You are about to drop the column `guaranteeId` on the `RepairTicket` table. All the data in the column will be lost.
  - Added the required column `sequenceNumber` to the `Installment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('EXCHANGE', 'REPAIR', 'RETURN');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED');

-- AlterEnum
ALTER TYPE "AffiliateStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LOW_STOCK_ALERT';
ALTER TYPE "NotificationType" ADD VALUE 'AFFILIATE_APPLICATION';
ALTER TYPE "NotificationType" ADD VALUE 'GUARANTEE_EXPIRY';

-- AlterTable
ALTER TABLE "AffiliateProfile" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "BlogArticle" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Installment" ADD COLUMN     "sequenceNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "estimatedDeliveryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "fulfillmentBranchId" TEXT,
ADD COLUMN     "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "receiptNumber" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT;

-- AlterTable
ALTER TABLE "RepairTicket" DROP COLUMN "guaranteeId",
ADD COLUMN     "guaranteeCardId" TEXT,
ADD COLUMN     "requestType" "RequestType" NOT NULL DEFAULT 'REPAIR';

-- CreateTable
CREATE TABLE "ProductStockByBranch" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStockByBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseDocument" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "branchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "errorMessage" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeBaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InStorePurchase" (
    "id" TEXT NOT NULL,
    "receiptImageUrl" TEXT,
    "purchaserId" TEXT,
    "affiliateId" TEXT,
    "productId" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InStorePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductStockByBranch_variantId_branchId_key" ON "ProductStockByBranch"("variantId", "branchId");

-- CreateIndex
CREATE INDEX "ProductReview_productId_status_idx" ON "ProductReview"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_productId_userId_key" ON "ProductReview"("productId", "userId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AffiliateReferral_orderId_idx" ON "AffiliateReferral"("orderId");

-- CreateIndex
CREATE INDEX "BlogArticle_status_publishedAt_idx" ON "BlogArticle"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Installment_orderId_status_dueDate_idx" ON "Installment"("orderId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_fulfillmentBranchId_fkey" FOREIGN KEY ("fulfillmentBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairTicket" ADD CONSTRAINT "RepairTicket_guaranteeCardId_fkey" FOREIGN KEY ("guaranteeCardId") REFERENCES "GuaranteeCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairStatusHistory" ADD CONSTRAINT "RepairStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockByBranch" ADD CONSTRAINT "ProductStockByBranch_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockByBranch" ADD CONSTRAINT "ProductStockByBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairAttachment" ADD CONSTRAINT "RepairAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "RepairTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseDocument" ADD CONSTRAINT "KnowledgeBaseDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InStorePurchase" ADD CONSTRAINT "InStorePurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
