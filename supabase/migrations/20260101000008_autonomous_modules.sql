-- BLACKWAYCONNECT autonomous modules:
-- phone assistance, Google review workflows, leads, e-commerce builder
--
-- Google reviews: generation/suggestions + request flows ONLY.
-- Posting reviews to Google requires a validated Google Business API integration.
-- Never auto-post fabricated Google reviews.
--
-- Storefront checkout: payment status remains integration_required until
-- Stripe Connect / store Checkout is implemented. Do not fake payments.

-- Extend module_key enum for new autonomous surfaces
ALTER TYPE module_key ADD VALUE IF NOT EXISTS 'phone_assistance';
ALTER TYPE module_key ADD VALUE IF NOT EXISTS 'google_reviews';
ALTER TYPE module_key ADD VALUE IF NOT EXISTS 'leads';
ALTER TYPE module_key ADD VALUE IF NOT EXISTS 'ecommerce';

-- ---------------------------------------------------------------------------
-- Phone assistance (telephony/voice agent — Phase scaffolding)
-- ---------------------------------------------------------------------------
CREATE TYPE phone_assistant_status AS ENUM (
  'draft',
  'active',
  'paused',
  'integration_required'
);

CREATE TYPE phone_call_status AS ENUM (
  'queued',
  'ringing',
  'in_progress',
  'completed',
  'failed',
  'no_answer',
  'integration_required'
);

CREATE TABLE phone_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status phone_assistant_status NOT NULL DEFAULT 'integration_required',
  provider TEXT, -- e.g. twilio, vapi — null until provider wired
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES phone_assistants(id) ON DELETE CASCADE,
  status phone_call_status NOT NULL DEFAULT 'integration_required',
  duration_seconds INT,
  transcript JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_assistants_org ON phone_assistants(organization_id);
CREATE INDEX idx_phone_calls_assistant ON phone_calls(assistant_id);

-- ---------------------------------------------------------------------------
-- Google Business reputation / review request workflows
-- ---------------------------------------------------------------------------
CREATE TYPE review_campaign_status AS ENUM (
  'planned',
  'active',
  'paused',
  'completed',
  'integration_required'
);

CREATE TYPE review_request_status AS ENUM (
  'draft',
  'sent',
  'completed',
  'failed'
);

-- Suggestions only — never treat as posted Google reviews
CREATE TYPE review_suggestion_status AS ENUM (
  'suggestion_only',
  'copied',
  'discarded'
);

CREATE TABLE review_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Review campaign',
  google_location_id TEXT, -- nullable until Google Business API connected
  status review_campaign_status NOT NULL DEFAULT 'planned',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES review_campaigns(id) ON DELETE CASCADE,
  customer_contact TEXT NOT NULL,
  customer_name TEXT,
  status review_request_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE generated_review_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status review_suggestion_status NOT NULL DEFAULT 'suggestion_only',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_campaigns_org ON review_campaigns(organization_id);
CREATE INDEX idx_review_requests_campaign ON review_requests(campaign_id);

COMMENT ON TABLE review_campaigns IS
  'Google review request campaigns. Status planned/integration_required until Google API is wired. Does not post reviews.';
COMMENT ON TABLE generated_review_suggestions IS
  'AI-generated review text suggestions for customers only. NEVER auto-posted to Google.';

-- ---------------------------------------------------------------------------
-- Leads (first-class autonomous CRM intake)
-- ---------------------------------------------------------------------------
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'won',
  'lost',
  'archived'
);

CREATE TYPE lead_source_key AS ENUM (
  'website_form',
  'chatbot',
  'phone_assistance',
  'google_review_campaign',
  'manual',
  'import',
  'quote_request',
  'other'
);

CREATE TABLE lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key lead_source_key NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source lead_source_key NOT NULL DEFAULT 'manual',
  source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
  status lead_status NOT NULL DEFAULT 'new',
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  score INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  assigned_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  chatbot_lead_id UUID REFERENCES chatbot_leads(id) ON DELETE SET NULL,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'note',
  content TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(organization_id, status);
CREATE INDEX idx_leads_email ON leads(organization_id, email);
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);

-- ---------------------------------------------------------------------------
-- E-commerce / Boutique en ligne builder
-- ---------------------------------------------------------------------------
CREATE TYPE store_status AS ENUM (
  'draft',
  'active',
  'paused',
  'archived'
);

CREATE TYPE store_product_status AS ENUM (
  'draft',
  'active',
  'archived',
  'out_of_stock'
);

CREATE TYPE store_order_status AS ENUM (
  'draft',
  'pending_payment',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
  'integration_required'
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status store_status NOT NULL DEFAULT 'draft',
  currency TEXT NOT NULL DEFAULT 'usd',
  settings JSONB NOT NULL DEFAULT '{}',
  -- checkout_status documents honest payment readiness
  checkout_status TEXT NOT NULL DEFAULT 'integration_required',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  sku TEXT,
  inventory INT,
  status store_product_status NOT NULL DEFAULT 'draft',
  media JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_email TEXT,
  status store_order_status NOT NULL DEFAULT 'integration_required',
  total_cents INT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  stripe_payment_intent_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES store_products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INT NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0)
);

CREATE INDEX idx_stores_org ON stores(organization_id);
CREATE INDEX idx_store_products_store ON store_products(store_id);
CREATE INDEX idx_store_orders_store ON store_orders(store_id);

COMMENT ON COLUMN stores.checkout_status IS
  'Storefront payment checkout = integration_required until Stripe Connect/store Checkout is implemented.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE phone_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_review_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY phone_assistants_select ON phone_assistants FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY phone_assistants_insert ON phone_assistants FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY phone_assistants_update ON phone_assistants FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY phone_assistants_delete ON phone_assistants FOR DELETE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY phone_calls_select ON phone_calls FOR SELECT TO authenticated
  USING (assistant_id IN (SELECT id FROM phone_assistants WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY phone_calls_write ON phone_calls FOR ALL TO authenticated
  USING (assistant_id IN (SELECT id FROM phone_assistants WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (assistant_id IN (SELECT id FROM phone_assistants WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY review_campaigns_select ON review_campaigns FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY review_campaigns_insert ON review_campaigns FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY review_campaigns_update ON review_campaigns FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY review_campaigns_delete ON review_campaigns FOR DELETE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY review_requests_select ON review_requests FOR SELECT TO authenticated
  USING (campaign_id IN (SELECT id FROM review_campaigns WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY review_requests_write ON review_requests FOR ALL TO authenticated
  USING (campaign_id IN (SELECT id FROM review_campaigns WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (campaign_id IN (SELECT id FROM review_campaigns WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY review_suggestions_select ON generated_review_suggestions FOR SELECT TO authenticated
  USING (
    request_id IN (
      SELECT rr.id FROM review_requests rr
      JOIN review_campaigns rc ON rc.id = rr.campaign_id
      WHERE rc.organization_id IN (SELECT requesting_org_ids())
    )
  );
CREATE POLICY review_suggestions_write ON generated_review_suggestions FOR ALL TO authenticated
  USING (
    request_id IN (
      SELECT rr.id FROM review_requests rr
      JOIN review_campaigns rc ON rc.id = rr.campaign_id
      WHERE rc.organization_id IN (SELECT requesting_org_ids())
    )
  )
  WITH CHECK (
    request_id IN (
      SELECT rr.id FROM review_requests rr
      JOIN review_campaigns rc ON rc.id = rr.campaign_id
      WHERE rc.organization_id IN (SELECT requesting_org_ids())
    )
  );

CREATE POLICY lead_sources_all ON lead_sources FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY leads_select ON leads FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY leads_insert ON leads FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT requesting_org_ids())
    AND org_within_limit(organization_id, 'max_leads')
  );
CREATE POLICY leads_update ON leads FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY leads_delete ON leads FOR DELETE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY lead_activities_all ON lead_activities FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY stores_select ON stores FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY stores_insert ON stores FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT requesting_org_ids())
    AND org_within_limit(organization_id, 'max_stores')
  );
CREATE POLICY stores_update ON stores FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY stores_delete ON stores FOR DELETE TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY store_products_select ON store_products FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY store_products_write ON store_products FOR ALL TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY store_orders_select ON store_orders FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY store_orders_write ON store_orders FOR ALL TO authenticated
  USING (store_id IN (SELECT id FROM stores WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (store_id IN (SELECT id FROM stores WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY store_order_items_select ON store_order_items FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM store_orders o
      JOIN stores s ON s.id = o.store_id
      WHERE s.organization_id IN (SELECT requesting_org_ids())
    )
  );
CREATE POLICY store_order_items_write ON store_order_items FOR ALL TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM store_orders o
      JOIN stores s ON s.id = o.store_id
      WHERE s.organization_id IN (SELECT requesting_org_ids())
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM store_orders o
      JOIN stores s ON s.id = o.store_id
      WHERE s.organization_id IN (SELECT requesting_org_ids())
    )
  );
