-- NoirRoutes seed data (DEV provisional prices — modify via admin before PROD)

INSERT INTO app_settings (key, value) VALUES
  ('billing_grace_period_days', '7'),
  ('default_currency', '"usd"')
ON CONFLICT (key) DO NOTHING;

-- Plans
INSERT INTO plans (tier, slug, name, description, is_public, trial_days, sort_order) VALUES
  ('starter', 'starter', 'Starter', 'For entrepreneurs and creators getting started', true, 7, 1),
  ('growth', 'growth', 'Growth', 'For small businesses building visibility with AI', true, 7, 2),
  ('business', 'business', 'Business', 'For serious businesses with multiple projects', true, 7, 3),
  ('scale', 'scale', 'Scale', 'For growing companies with social and analytics', true, 7, 4),
  ('agency', 'agency', 'Agency', 'For agencies managing multiple clients', true, 7, 5),
  ('enterprise', 'enterprise', 'Enterprise', 'Custom solutions for large organizations', false, 0, 6)
ON CONFLICT (tier) DO NOTHING;

-- Provisional prices (amount_cents = provisional DEV only)
INSERT INTO plan_prices (plan_id, interval, amount_cents, annual_discount_percent, stripe_price_id)
SELECT p.id, 'month'::billing_interval,
  CASE p.tier
    WHEN 'starter' THEN 2900
    WHEN 'growth' THEN 7900
    WHEN 'business' THEN 14900
    WHEN 'scale' THEN 29900
    WHEN 'agency' THEN 49900
    WHEN 'enterprise' THEN 0
  END,
  0,
  'price_dev_' || p.slug || '_monthly'
FROM plans p
ON CONFLICT DO NOTHING;

INSERT INTO plan_prices (plan_id, interval, amount_cents, annual_discount_percent, stripe_price_id)
SELECT p.id, 'year'::billing_interval,
  CASE p.tier
    WHEN 'starter' THEN 29000
    WHEN 'growth' THEN 79000
    WHEN 'business' THEN 149000
    WHEN 'scale' THEN 299000
    WHEN 'agency' THEN 499000
    WHEN 'enterprise' THEN 0
  END,
  17,
  'price_dev_' || p.slug || '_yearly'
FROM plans p WHERE p.tier != 'enterprise'
ON CONFLICT DO NOTHING;

-- Plan limits
INSERT INTO plan_limits (plan_id, limit_key, value_int)
SELECT p.id, l.limit_key, l.value_int FROM plans p
CROSS JOIN (VALUES
  ('starter', 'max_projects', 1), ('starter', 'max_websites', 1), ('starter', 'max_pages_per_website', 5),
  ('starter', 'max_ai_generations_per_month', 50), ('starter', 'max_seo_campaigns', 1), ('starter', 'max_seo_audits_per_month', 2),
  ('starter', 'max_chatbots', 1), ('starter', 'max_chatbot_conversations', 100), ('starter', 'max_social_accounts', 0),
  ('starter', 'max_social_posts_per_month', 0), ('starter', 'max_team_members', 1), ('starter', 'max_storage_mb', 500), ('starter', 'max_agency_clients', 0),
  ('growth', 'max_projects', 3), ('growth', 'max_websites', 2), ('growth', 'max_pages_per_website', 15),
  ('growth', 'max_ai_generations_per_month', 200), ('growth', 'max_seo_campaigns', 3), ('growth', 'max_seo_audits_per_month', 10),
  ('growth', 'max_chatbots', 2), ('growth', 'max_chatbot_conversations', 500), ('growth', 'max_social_accounts', 2),
  ('growth', 'max_social_posts_per_month', 20), ('growth', 'max_team_members', 3), ('growth', 'max_storage_mb', 2000), ('growth', 'max_agency_clients', 0),
  ('business', 'max_projects', 10), ('business', 'max_websites', 5), ('business', 'max_pages_per_website', 50),
  ('business', 'max_ai_generations_per_month', 1000), ('business', 'max_seo_campaigns', 10), ('business', 'max_seo_audits_per_month', 30),
  ('business', 'max_chatbots', 5), ('business', 'max_chatbot_conversations', 2000), ('business', 'max_social_accounts', 5),
  ('business', 'max_social_posts_per_month', 100), ('business', 'max_team_members', 8), ('business', 'max_storage_mb', 10000), ('business', 'max_agency_clients', 0),
  ('scale', 'max_projects', 25), ('scale', 'max_websites', 15), ('scale', 'max_pages_per_website', 100),
  ('scale', 'max_ai_generations_per_month', 5000), ('scale', 'max_seo_campaigns', 25), ('scale', 'max_seo_audits_per_month', 100),
  ('scale', 'max_chatbots', 10), ('scale', 'max_chatbot_conversations', 10000), ('scale', 'max_social_accounts', 15),
  ('scale', 'max_social_posts_per_month', 500), ('scale', 'max_team_members', 15), ('scale', 'max_storage_mb', 50000), ('scale', 'max_agency_clients', 5),
  ('agency', 'max_projects', 50), ('agency', 'max_websites', 30), ('agency', 'max_pages_per_website', -1),
  ('agency', 'max_ai_generations_per_month', 20000), ('agency', 'max_seo_campaigns', 50), ('agency', 'max_seo_audits_per_month', -1),
  ('agency', 'max_chatbots', 25), ('agency', 'max_chatbot_conversations', 50000), ('agency', 'max_social_accounts', 50),
  ('agency', 'max_social_posts_per_month', 2000), ('agency', 'max_team_members', 25), ('agency', 'max_storage_mb', 100000), ('agency', 'max_agency_clients', -1),
  ('enterprise', 'max_projects', -1), ('enterprise', 'max_websites', -1), ('enterprise', 'max_pages_per_website', -1),
  ('enterprise', 'max_ai_generations_per_month', -1), ('enterprise', 'max_seo_campaigns', -1), ('enterprise', 'max_seo_audits_per_month', -1),
  ('enterprise', 'max_chatbots', -1), ('enterprise', 'max_chatbot_conversations', -1), ('enterprise', 'max_social_accounts', -1),
  ('enterprise', 'max_social_posts_per_month', -1), ('enterprise', 'max_team_members', -1), ('enterprise', 'max_storage_mb', -1), ('enterprise', 'max_agency_clients', -1)
) AS l(tier, limit_key, value_int)
WHERE p.tier::text = l.tier
ON CONFLICT (plan_id, limit_key) DO NOTHING;

-- Plan features
INSERT INTO plan_features (plan_id, feature_key, enabled)
SELECT p.id, f.feature_key, f.enabled FROM plans p
CROSS JOIN (VALUES
  ('starter', 'has_website_builder', true), ('starter', 'has_seo', true), ('starter', 'has_chatbots', true),
  ('starter', 'has_client_portal', false), ('starter', 'has_business_management', false), ('starter', 'has_social_distribution', false),
  ('starter', 'has_advanced_analytics', false), ('starter', 'has_white_label', false), ('starter', 'has_agency_tools', false),
  ('starter', 'has_priority_support', false), ('starter', 'has_custom_integrations', false),
  ('growth', 'has_website_builder', true), ('growth', 'has_seo', true), ('growth', 'has_chatbots', true),
  ('growth', 'has_client_portal', false), ('growth', 'has_business_management', true), ('growth', 'has_social_distribution', false),
  ('growth', 'has_advanced_analytics', false), ('growth', 'has_white_label', false), ('growth', 'has_agency_tools', false),
  ('growth', 'has_priority_support', false), ('growth', 'has_custom_integrations', false),
  ('business', 'has_website_builder', true), ('business', 'has_seo', true), ('business', 'has_chatbots', true),
  ('business', 'has_client_portal', true), ('business', 'has_business_management', true), ('business', 'has_social_distribution', false),
  ('business', 'has_advanced_analytics', true), ('business', 'has_white_label', false), ('business', 'has_agency_tools', false),
  ('business', 'has_priority_support', false), ('business', 'has_custom_integrations', false),
  ('scale', 'has_website_builder', true), ('scale', 'has_seo', true), ('scale', 'has_chatbots', true),
  ('scale', 'has_client_portal', true), ('scale', 'has_business_management', true), ('scale', 'has_social_distribution', true),
  ('scale', 'has_advanced_analytics', true), ('scale', 'has_white_label', false), ('scale', 'has_agency_tools', false),
  ('scale', 'has_priority_support', true), ('scale', 'has_custom_integrations', false),
  ('agency', 'has_website_builder', true), ('agency', 'has_seo', true), ('agency', 'has_chatbots', true),
  ('agency', 'has_client_portal', true), ('agency', 'has_business_management', true), ('agency', 'has_social_distribution', true),
  ('agency', 'has_advanced_analytics', true), ('agency', 'has_white_label', true), ('agency', 'has_agency_tools', true),
  ('agency', 'has_priority_support', true), ('agency', 'has_custom_integrations', false),
  ('enterprise', 'has_website_builder', true), ('enterprise', 'has_seo', true), ('enterprise', 'has_chatbots', true),
  ('enterprise', 'has_client_portal', true), ('enterprise', 'has_business_management', true), ('enterprise', 'has_social_distribution', true),
  ('enterprise', 'has_advanced_analytics', true), ('enterprise', 'has_white_label', true), ('enterprise', 'has_agency_tools', true),
  ('enterprise', 'has_priority_support', true), ('enterprise', 'has_custom_integrations', true)
) AS f(tier, feature_key, enabled)
WHERE p.tier::text = f.tier
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- Service offers (Studio)
INSERT INTO service_offers (slug, name, description, pricing_model, base_price_cents, sort_order) VALUES
  ('website_creation', 'Website Creation', 'Complete website built by NoirRoutes', 'deposit', 250000, 1),
  ('web_app_creation', 'Web App Creation', 'Custom web application development', 'milestone', 500000, 2),
  ('mobile_app_creation', 'Mobile App Creation', 'iOS and Android app development', 'custom', NULL, 3),
  ('seo_service', 'SEO Service', 'Monthly or one-time SEO optimization', 'recurring', 150000, 4),
  ('automation_service', 'Automation Service', 'Business process automation', 'one_time', 200000, 5),
  ('redesign_service', 'Redesign Service', 'Complete website redesign', 'deposit', 180000, 6),
  ('branding_launch_package', 'Branding & Launch Package', 'Identity, landing, SEO, content and launch', 'deposit', 350000, 7),
  ('custom_digital_system', 'Custom Digital System', 'Fully custom project on quote', 'custom', NULL, 8)
ON CONFLICT (slug) DO NOTHING;

-- Add-ons
INSERT INTO add_ons (slug, name, type, limit_key, increment_value) VALUES
  ('ai_credits', 'AI Credits Pack', 'one_time', 'max_ai_generations_per_month', 100),
  ('extra_projects', 'Extra Projects', 'recurring', 'max_projects', 5),
  ('extra_websites', 'Extra Websites', 'recurring', 'max_websites', 3),
  ('extra_chatbots', 'Extra Chatbots', 'recurring', 'max_chatbots', 2),
  ('extra_seo_campaigns', 'Extra SEO Campaigns', 'recurring', 'max_seo_campaigns', 5),
  ('extra_social_accounts', 'Extra Social Accounts', 'recurring', 'max_social_accounts', 5),
  ('extra_social_posts', 'Extra Social Posts', 'one_time', 'max_social_posts_per_month', 50),
  ('extra_team_members', 'Extra Team Members', 'recurring', 'max_team_members', 3),
  ('extra_storage', 'Extra Storage', 'recurring', 'max_storage_mb', 5000),
  ('custom_domain', 'Custom Domain', 'recurring', NULL, 0),
  ('priority_support', 'Priority Support', 'recurring', NULL, 0),
  ('white_label', 'White Label', 'recurring', NULL, 0),
  ('advanced_analytics', 'Advanced Analytics', 'recurring', NULL, 0),
  ('assisted_onboarding', 'Assisted Onboarding', 'one_time', NULL, 0),
  ('site_migration', 'Site Migration', 'one_time', NULL, 0),
  ('app_store_publish', 'App Store Publish', 'one_time', NULL, 0)
ON CONFLICT (slug) DO NOTHING;

-- Provisional add-on prices (DEV placeholders — replace stripe_price_id before PROD)
-- Recurring -> month interval + _month; one_time -> null interval + _one_time
INSERT INTO add_on_prices (add_on_id, stripe_price_id, interval, amount_cents, is_active)
SELECT
  a.id,
  'price_dev_addon_' || a.slug || '_' ||
    CASE WHEN a.type = 'one_time' THEN 'one_time' ELSE 'month' END,
  CASE WHEN a.type = 'one_time' THEN NULL ELSE 'month'::billing_interval END,
  CASE a.slug
    WHEN 'ai_credits' THEN 1900
    WHEN 'extra_projects' THEN 1500
    WHEN 'extra_websites' THEN 2000
    WHEN 'extra_chatbots' THEN 2500
    WHEN 'extra_seo_campaigns' THEN 2000
    WHEN 'extra_social_accounts' THEN 1500
    WHEN 'extra_social_posts' THEN 1200
    WHEN 'extra_team_members' THEN 1000
    WHEN 'extra_storage' THEN 900
    WHEN 'priority_support' THEN 4900
    WHEN 'white_label' THEN 9900
    WHEN 'advanced_analytics' THEN 3900
    WHEN 'assisted_onboarding' THEN 14900
    WHEN 'site_migration' THEN 29900
    WHEN 'app_store_publish' THEN 19900
    ELSE 1000
  END,
  true
FROM add_ons a
WHERE a.is_active = true
ON CONFLICT (stripe_price_id) DO NOTHING;

-- Social platforms
INSERT INTO social_platforms (key, name, api_status, capabilities) VALUES
  ('facebook', 'Facebook Pages', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["image","video","text"]}'),
  ('instagram', 'Instagram Business', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["image","video"]}'),
  ('linkedin', 'LinkedIn', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["image","video","text"]}'),
  ('x', 'X / Twitter', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["text","image"]}'),
  ('tiktok', 'TikTok', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["video"]}'),
  ('youtube', 'YouTube', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["video"]}'),
  ('threads', 'Threads', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["text","image"]}'),
  ('google_business', 'Google Business Profile', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["text","image"]}'),
  ('pinterest', 'Pinterest', 'unavailable', '{"oauth":false,"publish":false,"schedule":false,"analytics":false,"media_types":["image"]}')
ON CONFLICT (key) DO NOTHING;

-- Onboarding templates (all plan tiers)
INSERT INTO onboarding_templates (plan_tier, step_key, sort_order) VALUES
  ('starter', 'welcome', 1), ('starter', 'organization', 2), ('starter', 'goals', 3), ('starter', 'complete', 4),
  ('growth', 'welcome', 1), ('growth', 'organization', 2), ('growth', 'goals', 3), ('growth', 'team', 4), ('growth', 'complete', 5),
  ('business', 'welcome', 1), ('business', 'organization', 2), ('business', 'goals', 3), ('business', 'team', 4),
    ('business', 'website', 5), ('business', 'complete', 6),
  ('scale', 'welcome', 1), ('scale', 'organization', 2), ('scale', 'goals', 3), ('scale', 'team', 4),
    ('scale', 'website', 5), ('scale', 'social', 6), ('scale', 'complete', 7),
  ('agency', 'welcome', 1), ('agency', 'organization', 2), ('agency', 'goals', 3), ('agency', 'team', 4),
    ('agency', 'clients', 5), ('agency', 'white_label', 6), ('agency', 'complete', 7),
  ('enterprise', 'welcome', 1), ('enterprise', 'organization', 2), ('enterprise', 'goals', 3),
    ('enterprise', 'team', 4), ('enterprise', 'custom', 5), ('enterprise', 'complete', 6)
ON CONFLICT (plan_tier, step_key) DO NOTHING;
