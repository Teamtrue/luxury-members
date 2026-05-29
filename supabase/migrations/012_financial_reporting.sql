-- 012_financial_reporting.sql
-- Monthly financial close reports for revenue reconciliation.

CREATE TABLE IF NOT EXISTS monthly_close_reports (
  id                 UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year        INT    NOT NULL,
  period_month       INT    NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  total_gmv_paise    BIGINT NOT NULL DEFAULT 0,
  total_bookings     INT    NOT NULL DEFAULT 0,
  new_members        INT    NOT NULL DEFAULT 0,
  churned_members    INT    NOT NULL DEFAULT 0,
  net_tokens_issued  BIGINT NOT NULL DEFAULT 0,
  status             TEXT   NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','reviewed','closed')),
  closed_at          TIMESTAMPTZ,
  closed_by          TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (period_year, period_month)
);

ALTER TABLE monthly_close_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_monthly_close_reports"
  ON monthly_close_reports USING (false);

DROP TRIGGER IF EXISTS trg_monthly_close_reports_updated_at ON monthly_close_reports;
CREATE TRIGGER trg_monthly_close_reports_updated_at
  BEFORE UPDATE ON monthly_close_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
