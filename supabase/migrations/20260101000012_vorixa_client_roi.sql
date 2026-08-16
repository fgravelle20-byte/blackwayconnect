-- VORIXA Business ROI: marketing spend per client + automatic profitability

CREATE TABLE IF NOT EXISTS client_marketing_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'cad',
  channel TEXT NOT NULL DEFAULT 'other'
    CHECK (channel IN ('ads','seo','social','email','referral','events','content','other')),
  spent_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'cad',
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('invoice','deal','manual')),
  source_id UUID,
  earned_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_marketing_expenses_org_client
  ON client_marketing_expenses(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_client_marketing_expenses_spent_on
  ON client_marketing_expenses(spent_on);
CREATE INDEX IF NOT EXISTS idx_client_revenue_entries_org_client
  ON client_revenue_entries(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_client_revenue_entries_source
  ON client_revenue_entries(source, source_id);

ALTER TABLE client_marketing_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_revenue_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_marketing_expenses_select ON client_marketing_expenses;
CREATE POLICY client_marketing_expenses_select ON client_marketing_expenses
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

DROP POLICY IF EXISTS client_marketing_expenses_write ON client_marketing_expenses;
CREATE POLICY client_marketing_expenses_write ON client_marketing_expenses
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

DROP POLICY IF EXISTS client_revenue_entries_select ON client_revenue_entries;
CREATE POLICY client_revenue_entries_select ON client_revenue_entries
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

DROP POLICY IF EXISTS client_revenue_entries_write ON client_revenue_entries;
CREATE POLICY client_revenue_entries_write ON client_revenue_entries
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

COMMENT ON TABLE client_marketing_expenses IS 'Marketing spend attributed to a client for ROI';
COMMENT ON TABLE client_revenue_entries IS 'Manual/extra revenue rows; paid invoices + won deals are computed live';
