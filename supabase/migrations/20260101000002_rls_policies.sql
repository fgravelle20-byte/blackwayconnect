-- RLS Helpers and Policies

-- Helper: get clerk user id from JWT (Clerk third-party auth)
CREATE OR REPLACE FUNCTION requesting_clerk_user_id()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claim.sub', true)
  );
$$;

CREATE OR REPLACE FUNCTION requesting_profile_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE clerk_user_id = requesting_clerk_user_id() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION requesting_org_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members
  WHERE profile_id = requesting_profile_id();
$$;

CREATE OR REPLACE FUNCTION has_org_role(org_id UUID, min_role org_role)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role org_role;
  role_rank INT;
  min_rank INT;
BEGIN
  SELECT role INTO user_role FROM organization_members
  WHERE organization_id = org_id AND profile_id = requesting_profile_id();
  IF user_role IS NULL THEN RETURN false; END IF;
  role_rank := CASE user_role
    WHEN 'client' THEN 1 WHEN 'member' THEN 2 WHEN 'admin' THEN 3 WHEN 'owner' THEN 4 END;
  min_rank := CASE min_role
    WHEN 'client' THEN 1 WHEN 'member' THEN 2 WHEN 'admin' THEN 3 WHEN 'owner' THEN 4 END;
  RETURN role_rank >= min_rank;
END;
$$;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins WHERE profile_id = requesting_profile_id()
  );
$$;

CREATE OR REPLACE FUNCTION org_effective_limit(org_id UUID, key TEXT)
RETURNS INT
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_limit INT;
  addon_bonus INT;
  current_plan_id UUID;
BEGIN
  SELECT s.plan_id INTO current_plan_id
  FROM subscriptions s
  WHERE s.organization_id = org_id AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC LIMIT 1;

  IF current_plan_id IS NULL THEN
    SELECT value_int INTO base_limit FROM plan_limits pl
    JOIN plans p ON p.id = pl.plan_id WHERE p.tier = 'starter' AND pl.limit_key = key;
  ELSE
    SELECT value_int INTO base_limit FROM plan_limits WHERE plan_id = current_plan_id AND limit_key = key;
  END IF;

  SELECT COALESCE(SUM(a.increment_value * ca.quantity), 0) INTO addon_bonus
  FROM customer_add_ons ca
  JOIN add_ons a ON a.id = ca.add_on_id
  WHERE ca.organization_id = org_id AND ca.status = 'active' AND a.limit_key = key;

  IF base_limit IS NULL THEN RETURN 0; END IF;
  IF base_limit = -1 THEN RETURN -1; END IF;
  RETURN base_limit + addon_bonus;
END;
$$;

CREATE OR REPLACE FUNCTION org_within_limit(org_id UUID, key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  eff_limit INT;
  current_usage INT;
BEGIN
  eff_limit := org_effective_limit(org_id, key);
  IF eff_limit = -1 THEN RETURN true; END IF;
  SELECT COALESCE(used_value, 0) INTO current_usage
  FROM subscription_usage
  WHERE organization_id = org_id AND limit_key = key
  ORDER BY period_end DESC LIMIT 1;
  IF current_usage IS NULL THEN current_usage := 0; END IF;
  RETURN current_usage < eff_limit;
END;
$$;

CREATE OR REPLACE FUNCTION org_has_feature(org_id UUID, feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_plan_id UUID;
  feat_enabled BOOLEAN;
BEGIN
  SELECT s.plan_id INTO current_plan_id
  FROM subscriptions s
  WHERE s.organization_id = org_id AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC LIMIT 1;
  IF current_plan_id IS NULL THEN RETURN false; END IF;
  SELECT enabled INTO feat_enabled FROM plan_features
  WHERE plan_id = current_plan_id AND feature_key = feature;
  RETURN COALESCE(feat_enabled, false);
END;
$$;

-- Enable RLS on all tenant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_on_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Public catalog read
CREATE POLICY plans_read ON plans FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY plan_prices_read ON plan_prices FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY plan_limits_read ON plan_limits FOR SELECT TO authenticated USING (true);
CREATE POLICY plan_features_read ON plan_features FOR SELECT TO authenticated USING (true);
CREATE POLICY add_ons_read ON add_ons FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY add_on_prices_read ON add_on_prices FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY service_offers_read ON service_offers FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY social_platforms_read ON social_platforms FOR SELECT TO authenticated USING (true);

-- Anon can read public catalog for marketing
CREATE POLICY plans_anon_read ON plans FOR SELECT TO anon USING (is_active = true AND is_public = true);
CREATE POLICY plan_prices_anon_read ON plan_prices FOR SELECT TO anon USING (is_active = true);
CREATE POLICY plan_limits_anon_read ON plan_limits FOR SELECT TO anon USING (true);
CREATE POLICY plan_features_anon_read ON plan_features FOR SELECT TO anon USING (true);
CREATE POLICY service_offers_anon_read ON service_offers FOR SELECT TO anon USING (is_active = true);
CREATE POLICY add_ons_anon_read ON add_ons FOR SELECT TO anon USING (is_active = true);
CREATE POLICY social_platforms_anon_read ON social_platforms FOR SELECT TO anon USING (true);

-- Profiles
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (id = requesting_profile_id() OR id IN (
    SELECT om2.profile_id FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.profile_id = requesting_profile_id()
  ));
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated
  USING (id = requesting_profile_id());

-- Organizations
CREATE POLICY orgs_select ON organizations FOR SELECT TO authenticated
  USING (id IN (SELECT requesting_org_ids()));
CREATE POLICY orgs_update ON organizations FOR UPDATE TO authenticated
  USING (has_org_role(id, 'admin'));

-- Organization members
CREATE POLICY org_members_select ON organization_members FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

-- Projects
CREATE POLICY projects_select ON projects FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY projects_insert ON projects FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()) AND org_within_limit(organization_id, 'max_projects'));
CREATE POLICY projects_update ON projects FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, 'admin'));
CREATE POLICY projects_delete ON projects FOR DELETE TO authenticated
  USING (has_org_role(organization_id, 'admin'));

-- Subscriptions (read for org admins)
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT TO authenticated
  USING (has_org_role(organization_id, 'admin') OR organization_id IN (SELECT requesting_org_ids()));

-- Subscription usage
CREATE POLICY sub_usage_select ON subscription_usage FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

-- Support tickets
CREATE POLICY tickets_select ON support_tickets FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY tickets_insert ON support_tickets FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()) AND profile_id = requesting_profile_id());
CREATE POLICY tickets_update ON support_tickets FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY ticket_messages_select ON support_messages FOR SELECT TO authenticated
  USING (ticket_id IN (SELECT id FROM support_tickets WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY ticket_messages_insert ON support_messages FOR INSERT TO authenticated
  WITH CHECK (profile_id = requesting_profile_id());

-- Quotes
CREATE POLICY quotes_select ON quotes FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY quotes_insert ON quotes FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()) AND has_org_role(organization_id, 'member'));
CREATE POLICY quotes_update ON quotes FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, 'admin'));

-- Service requests (public insert via service role; authenticated read own org)
CREATE POLICY service_requests_select ON service_requests FOR SELECT TO authenticated
  USING (organization_id IS NULL OR organization_id IN (SELECT requesting_org_ids()));

-- Onboarding
CREATE POLICY onboarding_select ON onboarding_progress FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY onboarding_upsert ON onboarding_progress FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

-- Social oauth tokens: deny all client access
REVOKE ALL ON social_oauth_tokens FROM authenticated, anon;

-- Platform admin
CREATE POLICY platform_admins_self ON platform_admins FOR SELECT TO authenticated
  USING (profile_id = requesting_profile_id() OR is_platform_admin());

-- Storage buckets (run separately in Supabase dashboard or migration)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('org-documents', 'org-documents', false);
