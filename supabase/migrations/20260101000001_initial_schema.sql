-- NoirRoutes Phase 1: Core schema
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'client');
CREATE TYPE subscription_status AS ENUM ('trialing','active','past_due','canceled','unpaid','paused');
CREATE TYPE plan_tier AS ENUM ('starter','growth','business','scale','agency','enterprise');
CREATE TYPE billing_interval AS ENUM ('month','year');
CREATE TYPE add_on_type AS ENUM ('one_time','recurring','usage');
CREATE TYPE service_pricing_model AS ENUM ('one_time','deposit','milestone','recurring','custom');
CREATE TYPE service_order_status AS ENUM ('draft','quoted','accepted','in_progress','completed','cancelled');
CREATE TYPE service_payment_type AS ENUM ('deposit','milestone','final','recurring','one_time');
CREATE TYPE module_key AS ENUM ('website_builder','seo','chatbot','business','social','client_portal','analytics','white_label','agency','studio');
CREATE TYPE project_status AS ENUM ('draft','active','archived');
CREATE TYPE project_type AS ENUM ('website','web_app','ios_app','android_app','hybrid');
CREATE TYPE website_status AS ENUM ('draft','preview','published','deployment_required');
CREATE TYPE quote_status AS ENUM ('draft','sent','accepted','rejected','expired');
CREATE TYPE business_invoice_status AS ENUM ('draft','sent','paid','overdue','void');
CREATE TYPE service_request_status AS ENUM ('new','reviewing','quoted','in_progress','completed','cancelled');
CREATE TYPE support_ticket_status AS ENUM ('open','pending','resolved','closed');
CREATE TYPE support_priority AS ENUM ('low','normal','high','urgent');
CREATE TYPE social_platform_key AS ENUM ('facebook','instagram','linkedin','x','tiktok','youtube','threads','google_business','pinterest');
CREATE TYPE connection_status AS ENUM ('disconnected','pending','connected','expired','error','revoked');
CREATE TYPE publish_status AS ENUM ('draft','scheduled','published','failed','needs_review','cancelled');
CREATE TYPE approval_status AS ENUM ('not_required','pending','approved','rejected');
CREATE TYPE payment_status AS ENUM ('pending','succeeded','failed','refunded');

-- Profiles (Clerk-synced)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_profile_id UUID REFERENCES profiles(id),
  stripe_customer_id TEXT UNIQUE,
  plan_tier plan_tier DEFAULT 'starter',
  white_label_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clerk_org_member_id TEXT,
  role org_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, profile_id)
);

CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  clerk_invitation_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Billing & Commerce
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier plan_tier UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  trial_days INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plan_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  stripe_price_id TEXT UNIQUE,
  interval billing_interval NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  annual_discount_percent INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  limit_key TEXT NOT NULL,
  value_int INT NOT NULL DEFAULT 0,
  UNIQUE(plan_id, limit_key)
);

CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  UNIQUE(plan_id, feature_key)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan_id UUID REFERENCES plans(id),
  status subscription_status DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_item_id TEXT,
  plan_price_id UUID REFERENCES plan_prices(id),
  add_on_price_id UUID,
  quantity INT DEFAULT 1
);

CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  limit_key TEXT NOT NULL,
  used_value INT DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  UNIQUE(organization_id, limit_key, period_start)
);

CREATE TABLE add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type add_on_type NOT NULL DEFAULT 'one_time',
  limit_key TEXT,
  increment_value INT DEFAULT 1,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE add_on_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  add_on_id UUID NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
  stripe_price_id TEXT UNIQUE,
  interval billing_interval,
  amount_cents INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE customer_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL REFERENCES add_ons(id),
  stripe_subscription_item_id TEXT,
  quantity INT DEFAULT 1,
  status TEXT DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE service_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  pricing_model service_pricing_model NOT NULL DEFAULT 'custom',
  base_price_cents INT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  service_offer_id UUID REFERENCES service_offers(id),
  service_request_id UUID,
  quote_id UUID,
  status service_order_status DEFAULT 'draft',
  pricing_model service_pricing_model,
  total_cents INT DEFAULT 0,
  deposit_cents INT DEFAULT 0,
  linked_subscription_id UUID REFERENCES subscriptions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE service_order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  type service_payment_type NOT NULL,
  amount_cents INT NOT NULL,
  status payment_status DEFAULT 'pending',
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  stripe_coupon_id TEXT,
  percent_off INT,
  amount_off_cents INT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  plan_id UUID REFERENCES plans(id),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  status TEXT,
  amount_due INT,
  amount_paid INT,
  pdf_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  invoice_id UUID REFERENCES invoices(id),
  amount INT NOT NULL,
  status payment_status DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type project_type DEFAULT 'website',
  status project_status DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  UNIQUE(project_id, profile_id)
);

CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  module_key module_key,
  model TEXT,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  cost_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Website Builder
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status website_status DEFAULT 'draft',
  preview_url TEXT,
  deployment_status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  seo_meta JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0
);

CREATE TABLE website_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_page_id UUID NOT NULL REFERENCES website_pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0
);

CREATE TABLE website_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB DEFAULT '[]'
);

CREATE TABLE website_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'planned',
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SEO
CREATE TABLE seo_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES seo_campaigns(id) ON DELETE CASCADE,
  results JSONB DEFAULT '{}',
  score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES seo_campaigns(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  target_url TEXT
);

CREATE TABLE seo_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES seo_audits(id) ON DELETE CASCADE,
  priority TEXT,
  status TEXT DEFAULT 'open',
  content TEXT
);

CREATE TABLE seo_rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
  position INT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Chatbot
CREATE TABLE chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  widget_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chatbot_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT,
  storage_path TEXT
);

CREATE TABLE chatbot_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  rule JSONB DEFAULT '{}'
);

CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chatbot_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES chatbot_conversations(id),
  email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Business
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT
);

CREATE TABLE business_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT,
  resource_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE business_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE business_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  stage_id UUID REFERENCES business_pipeline_stages(id),
  title TEXT NOT NULL,
  value_cents INT DEFAULT 0
);

CREATE TABLE business_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL
);

-- Studio
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  company TEXT,
  service_type TEXT,
  description TEXT NOT NULL,
  status service_request_status DEFAULT 'new',
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id),
  client_id UUID REFERENCES clients(id),
  title TEXT NOT NULL,
  status quote_status DEFAULT 'draft',
  total_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0
);

CREATE TABLE business_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id),
  client_id UUID REFERENCES clients(id),
  status business_invoice_status DEFAULT 'draft',
  total_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE business_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_invoice_id UUID NOT NULL REFERENCES business_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0
);

CREATE TABLE studio_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  signed_at TIMESTAMPTZ,
  storage_path TEXT
);

ALTER TABLE service_orders ADD CONSTRAINT fk_service_orders_request FOREIGN KEY (service_request_id) REFERENCES service_requests(id);
ALTER TABLE service_orders ADD CONSTRAINT fk_service_orders_quote FOREIGN KEY (quote_id) REFERENCES quotes(id);
ALTER TABLE subscription_items ADD CONSTRAINT fk_subscription_items_addon FOREIGN KEY (add_on_price_id) REFERENCES add_on_prices(id);

-- Support
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  subject TEXT NOT NULL,
  status support_ticket_status DEFAULT 'open',
  priority support_priority DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents & Notifications
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime TEXT,
  size_bytes BIGINT,
  linked_resource TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Social
CREATE TABLE social_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key social_platform_key UNIQUE NOT NULL,
  name TEXT NOT NULL,
  api_status TEXT DEFAULT 'unavailable',
  capabilities JSONB DEFAULT '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["text"]}'
);

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES social_platforms(id),
  connection_status connection_status DEFAULT 'disconnected',
  external_account_id TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID UNIQUE NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  encrypted_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES social_campaigns(id),
  content TEXT,
  approval_status approval_status DEFAULT 'not_required',
  publish_status publish_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social_post_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES social_accounts(id),
  adapted_content JSONB DEFAULT '{}'
);

CREATE TABLE social_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES social_post_variants(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'pending',
  retry_count INT DEFAULT 0
);

CREATE TABLE social_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES social_post_variants(id) ON DELETE CASCADE,
  metrics JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES social_post_variants(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  attempt_at TIMESTAMPTZ DEFAULT now(),
  status TEXT,
  provider_response JSONB
);

CREATE TABLE social_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  approver_profile_id UUID REFERENCES profiles(id),
  status approval_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin & Observability
CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  rules JSONB DEFAULT '{}'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier plan_tier NOT NULL,
  step_key TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  UNIQUE(plan_tier, step_key)
);

CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  UNIQUE(organization_id, step_key)
);

-- Indexes
CREATE UNIQUE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE UNIQUE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_profile ON organization_members(profile_id);
CREATE UNIQUE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_org_status ON subscriptions(organization_id, status);
CREATE INDEX idx_subscription_usage_org_period ON subscription_usage(organization_id, limit_key, period_end);
CREATE INDEX idx_projects_org ON projects(organization_id, status);
CREATE INDEX idx_support_tickets_org ON support_tickets(organization_id, status);
CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE UNIQUE INDEX idx_stripe_events_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_plans_public ON plans(sort_order) WHERE is_active = true AND is_public = true;
