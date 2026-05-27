-- =============================================================================
-- Migration 0003: auth features
-- Safe to run against a DB that was set up via `prisma db push` (uses IF NOT EXISTS)
-- Adds: google_id, is_admin columns; refresh_tokens table; invite_codes table
-- Makes password_hash nullable for Google OAuth support
-- =============================================================================

-- Make password_hash nullable (Google OAuth users have no password)
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Add google_id column for Google OAuth
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_key" ON "users"("google_id");

-- Add is_admin column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id"         TEXT        NOT NULL,
    "token"      TEXT        NOT NULL,
    "user_id"    TEXT        NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "refresh_tokens_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS "invite_codes" (
    "id"         TEXT        NOT NULL,
    "code"       TEXT        NOT NULL,
    "used_by"    TEXT,
    "used_at"    TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "invite_codes_code_key" ON "invite_codes"("code");
