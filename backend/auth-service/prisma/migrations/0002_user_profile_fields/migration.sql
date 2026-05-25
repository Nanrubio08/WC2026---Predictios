-- AlterTable
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "name"          TEXT,
  ADD COLUMN IF NOT EXISTS "phone"         TEXT,
  ADD COLUMN IF NOT EXISTS "favorite_team" TEXT,
  ADD COLUMN IF NOT EXISTS "avatar_url"    TEXT;
