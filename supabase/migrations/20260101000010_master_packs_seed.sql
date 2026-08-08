-- Master forfaits positioning + module packs (provisional DEV prices)

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
    WHEN 'growth' THEN 'Site, SEO, boutique, téléphone, avis Google — croissance accélérée'
    WHEN 'business' THEN 'Multi-projets, analytics, portail client — machine commerciale complète'
    WHEN 'scale' THEN 'Social AI + volume — propulsez votre marque partout'
    WHEN 'agency' THEN 'Multi-clients, white-label — vendez BLACKWAYCONNECT sous votre marque'
    WHEN 'enterprise' THEN 'Volume illimité, SLA, intégrations custom — sur devis'
  END
WHERE true;

-- Module à l'unité (unlock features without full plan upgrade)
INSERT INTO add_ons (slug, name, description, type, limit_key, increment_value, category, unlocks_feature, sort_order, is_public, headline, badge) VALUES
  ('module_website_builder', 'Module Site Web IA', 'Créateur de sites autonome — pages, contenu, SEO de base', 'recurring', 'max_websites', 1, 'module', 'has_website_builder', 1, true, 'Créez votre site en minutes', 'POPULAIRE'),
  ('module_chatbot', 'Module Chatbot Conversion', 'Chatbot qui qualifie et convertit les visiteurs en acheteurs', 'recurring', 'max_chatbots', 1, 'module', 'has_chatbots', 2, true, 'Convertissez 24/7', 'MASTER'),
  ('module_ecommerce', 'Module Boutique en ligne', 'E-commerce builder — produits, commandes, vitrine', 'recurring', 'max_stores', 1, 'module', 'has_ecommerce', 3, true, 'Vendez en ligne', NULL),
  ('module_leads', 'Module Leads CRM', 'Capture et pipeline leads (site, chat, téléphone, avis)', 'recurring', 'max_leads', 500, 'module', 'has_lead_management', 4, true, 'Ne perdez plus aucun prospect', NULL),
  ('module_phone', 'Module Assistance Téléphonique', 'Agent vocal IA — appels, qualification, prise de RDV', 'recurring', 'max_phone_assistants', 1, 'module', 'has_phone_assistance', 5, true, 'Répondez à chaque appel', 'NOUVEAU'),
  ('module_google_reviews', 'Module Google Reviews', 'Campagnes de demandes d''avis + suggestions IA (pas de faux avis)', 'recurring', 'max_review_campaigns', 3, 'module', 'has_google_reviews', 6, true, 'Boostez votre réputation', NULL),
  ('module_seo', 'Module SEO Engine', 'Audits, mots-clés, recommandations SEO', 'recurring', 'max_seo_campaigns', 3, 'module', 'has_seo', 7, true, 'Soyez trouvé sur Google', NULL),
  ('module_social', 'Module Social Distribution', 'Campagnes multi-réseaux (connecteurs selon API)', 'recurring', 'max_social_accounts', 3, 'module', 'has_social_distribution', 8, true, 'Publiez partout', NULL),
  ('module_business', 'Module Business Management', 'Clients, pipeline, documents, tâches', 'recurring', NULL, 0, 'module', 'has_business_management', 9, true, 'Pilotez votre business', NULL),
  ('pack_conversion', 'Pack Conversion', 'Chatbot + Leads + Google Reviews — stack acquisition', 'recurring', NULL, 0, 'growth', NULL, 10, true, 'Le pack qui vend', 'BEST VALUE'),
  ('pack_presence', 'Pack Présence Digitale', 'Site Web + SEO + Boutique', 'recurring', NULL, 0, 'growth', NULL, 11, true, 'Votre présence complète', NULL),
  ('pack_agency_boost', 'Pack Agency Boost', 'White-label + analytics + support prioritaire', 'recurring', NULL, 0, 'growth', NULL, 12, true, 'Pour les agences', NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  unlocks_feature = EXCLUDED.unlocks_feature,
  sort_order = EXCLUDED.sort_order,
  headline = EXCLUDED.headline,
  badge = EXCLUDED.badge,
  is_public = EXCLUDED.is_public;

-- Mark capacity add-ons
UPDATE add_ons SET category = 'capacity', is_public = true
WHERE slug IN (
  'ai_credits','extra_projects','extra_websites','extra_chatbots','extra_seo_campaigns',
  'extra_social_accounts','extra_social_posts','extra_team_members','extra_storage'
) AND (category IS NULL OR category = 'capacity');

UPDATE add_ons SET category = 'support', is_public = true
WHERE slug IN ('custom_domain','priority_support','white_label','advanced_analytics','assisted_onboarding','site_migration','app_store_publish');

-- Prices for new module add-ons (DEV provisional)
INSERT INTO add_on_prices (add_on_id, stripe_price_id, interval, amount_cents, is_active)
SELECT a.id, 'price_dev_addon_' || a.slug || '_month', 'month'::billing_interval,
  CASE a.slug
    WHEN 'module_website_builder' THEN 3900
    WHEN 'module_chatbot' THEN 4900
    WHEN 'module_ecommerce' THEN 5900
    WHEN 'module_leads' THEN 2900
    WHEN 'module_phone' THEN 7900
    WHEN 'module_google_reviews' THEN 3900
    WHEN 'module_seo' THEN 4500
    WHEN 'module_social' THEN 5500
    WHEN 'module_business' THEN 3500
    WHEN 'pack_conversion' THEN 9900
    WHEN 'pack_presence' THEN 11900
    WHEN 'pack_agency_boost' THEN 14900
    ELSE 2900
  END,
  true
FROM add_ons a
WHERE a.slug LIKE 'module_%' OR a.slug LIKE 'pack_%'
ON CONFLICT (stripe_price_id) DO NOTHING;

-- Studio offers rebrand
UPDATE service_offers SET
  name = CASE slug
    WHEN 'website_creation' THEN 'Création de site (Studio)'
    WHEN 'branding_launch_package' THEN 'Pack Lancement Marque'
    ELSE name
  END,
  description = CASE slug
    WHEN 'website_creation' THEN 'Site complet livré par BLACKWAYCONNECT Studio'
    ELSE description
  END
WHERE slug IN ('website_creation', 'branding_launch_package');
