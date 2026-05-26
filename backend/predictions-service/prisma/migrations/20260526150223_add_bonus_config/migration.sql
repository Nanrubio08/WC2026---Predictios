-- CreateTable
CREATE TABLE "bonus_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "winner" TEXT,
    "declared_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_config_pkey" PRIMARY KEY ("id")
);
