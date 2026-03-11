-- DropTable (order matters due to FK constraints)
DROP TABLE IF EXISTS "RepairAttachment";
DROP TABLE IF EXISTS "RepairStatusHistory";
DROP TABLE IF EXISTS "RepairTicket";
DROP TABLE IF EXISTS "GuaranteeCard";

-- DropEnum
DROP TYPE IF EXISTS "RequestType";
DROP TYPE IF EXISTS "RepairStatus";
DROP TYPE IF EXISTS "Priority";

-- Remove values from NotificationType enum
-- PostgreSQL does not support DROP VALUE from enum, so we recreate it
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM ('ORDER_UPDATE', 'COMMISSION', 'SYSTEM', 'PROMOTION', 'LOW_STOCK_ALERT', 'AFFILIATE_APPLICATION');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType" USING ("type"::text::"NotificationType");
DROP TYPE "NotificationType_old";
