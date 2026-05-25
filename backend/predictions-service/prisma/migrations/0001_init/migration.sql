CREATE TABLE "predictions" (
    "id"                     TEXT NOT NULL,
    "user_id"                TEXT NOT NULL,
    "match_id"               INTEGER NOT NULL,
    "home_score_predicted"   INTEGER NOT NULL,
    "away_score_predicted"   INTEGER NOT NULL,
    "points_earned"          INTEGER NOT NULL DEFAULT 0,
    "updated_at"             TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "predictions_user_id_match_id_key" ON "predictions"("user_id", "match_id");

CREATE TABLE "leaderboard" (
    "id"            TEXT NOT NULL,
    "user_id"       TEXT UNIQUE NOT NULL,
    "total_points"  INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id")
);
