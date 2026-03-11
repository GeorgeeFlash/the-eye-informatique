-- AlterTable
ALTER TABLE "Installment" ADD COLUMN     "receiptNumber" TEXT;

-- CreateTable
CREATE TABLE "ProductPageView" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "branchId" TEXT,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPageView_productId_createdAt_idx" ON "ProductPageView"("productId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProductPageView_branchId_createdAt_idx" ON "ProductPageView"("branchId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProductPageView_sessionId_productId_idx" ON "ProductPageView"("sessionId", "productId");

-- AddForeignKey
ALTER TABLE "ProductPageView" ADD CONSTRAINT "ProductPageView_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPageView" ADD CONSTRAINT "ProductPageView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPageView" ADD CONSTRAINT "ProductPageView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
