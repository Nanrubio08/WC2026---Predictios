-- AlterTable
ALTER TABLE "admin_audit_log" ADD COLUMN     "detail" TEXT,
ADD COLUMN     "service" TEXT NOT NULL DEFAULT 'matches',
ALTER COLUMN "match_id" DROP NOT NULL,
ALTER COLUMN "new_home" DROP NOT NULL,
ALTER COLUMN "new_away" DROP NOT NULL;
