-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "group" TEXT,
ADD COLUMN     "matchday" INTEGER,
ADD COLUMN     "stage" TEXT;

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "match_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "previous_home" INTEGER,
    "previous_away" INTEGER,
    "new_home" INTEGER NOT NULL,
    "new_away" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);
