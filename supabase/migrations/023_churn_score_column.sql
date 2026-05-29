-- 023_churn_score_column.sql
-- Add churn_score and upgrade_score columns to the memberships table.
-- Used by the membership lifecycle cron to store AI-computed scores.

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS churn_score decimal(4,3);
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS upgrade_score jsonb;
