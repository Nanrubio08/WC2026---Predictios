-- AlterTable
ALTER TABLE "leaderboard" ADD COLUMN     "correct_outcomes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "exact_matches" INTEGER NOT NULL DEFAULT 0;

-- Backfill tiebreaker counts from existing predictions
UPDATE leaderboard l
SET
  exact_matches = (SELECT COUNT(*) FROM predictions p WHERE p.user_id = l.user_id AND p.points_earned = 5),
  correct_outcomes = (SELECT COUNT(*) FROM predictions p WHERE p.user_id = l.user_id AND p.points_earned = 3);
