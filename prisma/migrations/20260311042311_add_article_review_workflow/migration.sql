-- CreateEnum
CREATE TYPE "PayoutPreference" AS ENUM ('MONTHLY', 'IMMEDIATE');

-- AlterEnum
ALTER TYPE "AffiliateStatus" ADD VALUE 'REVOKED';

-- AlterEnum
ALTER TYPE "ArticleStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "AffiliateProfile" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "payoutPreference" "PayoutPreference" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BlogArticle" ADD COLUMN     "draftOfId" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "reviewerNote" TEXT;

-- CreateIndex
CREATE INDEX "BlogArticle_draftOfId_idx" ON "BlogArticle"("draftOfId");

-- AddForeignKey
ALTER TABLE "AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogArticle" ADD CONSTRAINT "BlogArticle_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogArticle" ADD CONSTRAINT "BlogArticle_draftOfId_fkey" FOREIGN KEY ("draftOfId") REFERENCES "BlogArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
