-- Migration: 022_concierge_ai_columns
-- Add AI draft response columns to concierge_requests table.
-- These are populated by POST /api/concierge/ai-assist after a request is created.

ALTER TABLE concierge_requests ADD COLUMN IF NOT EXISTS ai_draft_response text;
ALTER TABLE concierge_requests ADD COLUMN IF NOT EXISTS ai_processed_at timestamptz;
