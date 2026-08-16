-- VORIXA: maintenance extras per plan (long-term subscription, light occasional tasks)
ALTER TABLE add_ons
  ADD COLUMN IF NOT EXISTS applies_to_plan_tier TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN add_ons.category IS 'capacity | module | support | growth | maintenance';
COMMENT ON COLUMN add_ons.applies_to_plan_tier IS 'When set, this add-on is offered as an EXTRA on that plan tier';
COMMENT ON COLUMN add_ons.metadata IS 'Extra commercial metadata (task caps, tools covered, billing notes)';

-- Brand plan names for VORIXA MASTER
UPDATE plans SET
  name = CASE tier
    WHEN 'starter' THEN 'Launch'
    WHEN 'growth' THEN 'Grow'
    WHEN 'business' THEN 'Dominate'
    WHEN 'scale' THEN 'Scale AI'
    WHEN 'agency' THEN 'Agency OS'
    WHEN 'enterprise' THEN 'Enterprise'
  END,
  description = CASE tier
    WHEN 'starter' THEN 'Site + chatbot + leads — démarrez et convertissez vos premiers clients'
    WHEN 'growth' THEN 'Site, SEO, boutique, téléphone, avis — croissance accélérée'
    WHEN 'business' THEN 'Multi-projets, analytics, portail client — machine commerciale complète'
    WHEN 'scale' THEN 'Social AI + volume — propulsez votre marque partout'
    WHEN 'agency' THEN 'Multi-clients, white-label — opérez VORIXA pour vos clients'
    WHEN 'enterprise' THEN 'Volume illimité, SLA, intégrations custom — sur devis'
  END,
  is_public = CASE WHEN tier = 'enterprise' THEN false ELSE true END
WHERE true;

-- Maintenance extras: recurring long-term, few occasional tasks, priced by forfait
INSERT INTO add_ons (
  slug, name, description, type, limit_key, increment_value,
  category, unlocks_feature, sort_order, is_public, headline, badge,
  applies_to_plan_tier, metadata
) VALUES
  (
    'maintenance_launch',
    'Maintenance Launch',
    'Abonnement long terme : petites tâches occasionnelles (contenus, correctifs mineurs, suivi) pour le forfait Launch.',
    'recurring', 'max_maintenance_tasks_per_month', 2,
    'maintenance', NULL, 20, true,
    'Extra maintenance — peu de tâches, engagement long terme',
    'EXTRA',
    'starter',
    '{"billing":"long_term","tasks_per_month":2,"tools":["website_builder","chatbots","leads"],"tone":"occasional"}'::jsonb
  ),
  (
    'maintenance_grow',
    'Maintenance Grow',
    'Abonnement long terme : maintenance occasionnelle couvrant site, SEO, boutique, téléphone et avis pour Grow.',
    'recurring', 'max_maintenance_tasks_per_month', 4,
    'maintenance', NULL, 21, true,
    'Extra maintenance Grow — suivi régulier léger',
    'EXTRA',
    'growth',
    '{"billing":"long_term","tasks_per_month":4,"tools":["website_builder","seo","ecommerce","phone","google_reviews","chatbots","leads"],"tone":"occasional"}'::jsonb
  ),
  (
    'maintenance_dominate',
    'Maintenance Dominate',
    'Abonnement long terme : maintenance occasionnelle multi-projets + portail + analytics pour Dominate.',
    'recurring', 'max_maintenance_tasks_per_month', 6,
    'maintenance', NULL, 22, true,
    'Extra maintenance Dominate — cockpit commercial',
    'EXTRA',
    'business',
    '{"billing":"long_term","tasks_per_month":6,"tools":["website_builder","seo","ecommerce","phone","google_reviews","chatbots","leads","business","client_portal","analytics"],"tone":"occasional"}'::jsonb
  ),
  (
    'maintenance_scale_ai',
    'Maintenance Scale AI',
    'Abonnement long terme : maintenance occasionnelle à volume + social pour Scale AI.',
    'recurring', 'max_maintenance_tasks_per_month', 10,
    'maintenance', NULL, 23, true,
    'Extra maintenance Scale AI — volume & social',
    'EXTRA',
    'scale',
    '{"billing":"long_term","tasks_per_month":10,"tools":["website_builder","seo","ecommerce","phone","google_reviews","chatbots","leads","business","social","analytics"],"tone":"occasional"}'::jsonb
  ),
  (
    'maintenance_agency_os',
    'Maintenance Agency OS',
    'Abonnement long terme : maintenance occasionnelle multi-clients / white-label pour Agency OS.',
    'recurring', 'max_maintenance_tasks_per_month', 15,
    'maintenance', NULL, 24, true,
    'Extra maintenance Agency OS — multi-clients',
    'EXTRA',
    'agency',
    '{"billing":"long_term","tasks_per_month":15,"tools":["website_builder","seo","ecommerce","phone","google_reviews","chatbots","leads","business","social","analytics","white_label","agency"],"tone":"occasional"}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  limit_key = EXCLUDED.limit_key,
  increment_value = EXCLUDED.increment_value,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  is_public = EXCLUDED.is_public,
  headline = EXCLUDED.headline,
  badge = EXCLUDED.badge,
  applies_to_plan_tier = EXCLUDED.applies_to_plan_tier,
  metadata = EXCLUDED.metadata;

-- Monthly provisional prices (scale with forfait + tools covered)
INSERT INTO add_on_prices (add_on_id, stripe_price_id, interval, amount_cents, is_active)
SELECT a.id, 'price_dev_addon_' || a.slug || '_month', 'month'::billing_interval,
  CASE a.slug
    WHEN 'maintenance_launch' THEN 1900
    WHEN 'maintenance_grow' THEN 3900
    WHEN 'maintenance_dominate' THEN 6900
    WHEN 'maintenance_scale_ai' THEN 11900
    WHEN 'maintenance_agency_os' THEN 19900
    ELSE 2900
  END,
  true
FROM add_ons a
WHERE a.category = 'maintenance'
ON CONFLICT (stripe_price_id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  is_active = true;

-- Yearly long-term commitment (~2 months free)
INSERT INTO add_on_prices (add_on_id, stripe_price_id, interval, amount_cents, is_active)
SELECT a.id, 'price_dev_addon_' || a.slug || '_year', 'year'::billing_interval,
  CASE a.slug
    WHEN 'maintenance_launch' THEN 19000
    WHEN 'maintenance_grow' THEN 39000
    WHEN 'maintenance_dominate' THEN 69000
    WHEN 'maintenance_scale_ai' THEN 119000
    WHEN 'maintenance_agency_os' THEN 199000
    ELSE 29000
  END,
  true
FROM add_ons a
WHERE a.category = 'maintenance'
ON CONFLICT (stripe_price_id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  is_active = true;

-- Ensure plan limits include maintenance task capacity (0 by default; unlocked via add-on increment)
INSERT INTO plan_limits (plan_id, limit_key, value_int)
SELECT p.id, 'max_maintenance_tasks_per_month', 0
FROM plans p
ON CONFLICT (plan_id, limit_key) DO NOTHING;
