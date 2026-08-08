-- RLS commerce extras: soft-delete orgs + missing SELECT policies
-- Tables: service_order_payments, customer_add_ons, documents, notifications

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at
  ON organizations(deleted_at)
  WHERE deleted_at IS NULL;

-- Enable RLS where not already covered by 20260101000002
ALTER TABLE service_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- customer_add_ons already has RLS enabled in prior migration

-- customer_add_ons: org members can read their add-ons
DROP POLICY IF EXISTS customer_add_ons_select ON customer_add_ons;
CREATE POLICY customer_add_ons_select ON customer_add_ons
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

-- service_order_payments: org admins can read payments for their service orders
DROP POLICY IF EXISTS service_order_payments_select ON service_order_payments;
CREATE POLICY service_order_payments_select ON service_order_payments
  FOR SELECT TO authenticated
  USING (
    service_order_id IN (
      SELECT so.id
      FROM service_orders so
      WHERE has_org_role(so.organization_id, 'admin')
    )
  );

-- documents: org members can read
DROP POLICY IF EXISTS documents_select ON documents;
CREATE POLICY documents_select ON documents
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

DROP POLICY IF EXISTS documents_insert ON documents;
CREATE POLICY documents_insert ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT requesting_org_ids())
    AND has_org_role(organization_id, 'member')
  );

-- notifications: recipient (or org member) can read
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT TO authenticated
  USING (
    profile_id = requesting_profile_id()
    OR organization_id IN (SELECT requesting_org_ids())
  );

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE TO authenticated
  USING (profile_id = requesting_profile_id());

-- Soft-deleted orgs should not appear in requesting_org_ids
CREATE OR REPLACE FUNCTION requesting_org_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.organization_id
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.profile_id = requesting_profile_id()
    AND o.deleted_at IS NULL;
$$;
