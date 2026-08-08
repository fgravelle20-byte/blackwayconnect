-- Missing commerce / tenant indexes from architecture plan + profile soft-delete

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON profiles(deleted_at)
  WHERE deleted_at IS NULL;

-- Billing
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_created ON payments(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_add_ons_org ON customer_add_ons(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_service_orders_org_status ON service_orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_service_order_payments_order ON service_order_payments(service_order_id, status);
CREATE INDEX IF NOT EXISTS idx_add_ons_slug ON add_ons(slug) WHERE is_active = true;

-- Tenant scoping
CREATE INDEX IF NOT EXISTS idx_websites_org ON websites(organization_id);
CREATE INDEX IF NOT EXISTS idx_seo_campaigns_org ON seo_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_org ON chatbots(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_org_status ON social_posts(organization_id, publish_status);

-- Studio
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_org_status ON quotes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_business_invoices_org ON business_invoices(organization_id, status);

-- Observability
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_created ON ai_usage_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);

-- Social schedules (future cron)
CREATE INDEX IF NOT EXISTS idx_social_schedules_pending ON social_schedules(scheduled_at)
  WHERE status = 'pending';

-- Soft-deleted profiles should not resolve via requesting_profile_id
CREATE OR REPLACE FUNCTION requesting_profile_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles
  WHERE clerk_user_id = requesting_clerk_user_id()
    AND deleted_at IS NULL
  LIMIT 1;
$$;
