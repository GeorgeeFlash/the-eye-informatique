-- CreateTable
CREATE TABLE "ServerCartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerCartItem_userId_idx" ON "ServerCartItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerCartItem_userId_variantId_key" ON "ServerCartItem"("userId", "variantId");

-- AddForeignKey
ALTER TABLE "ServerCartItem" ADD CONSTRAINT "ServerCartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerCartItem" ADD CONSTRAINT "ServerCartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
