CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'live', 'finished');

CREATE TABLE "matches" (
    "id"                 INTEGER NOT NULL,
    "home_team"          TEXT NOT NULL,
    "away_team"          TEXT NOT NULL,
    "home_logo_url"      TEXT,
    "away_logo_url"      TEXT,
    "kickoff_time"       TIMESTAMP(3) NOT NULL,
    "home_score_actual"  INTEGER,
    "away_score_actual"  INTEGER,
    "status"             "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "updated_at"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);
