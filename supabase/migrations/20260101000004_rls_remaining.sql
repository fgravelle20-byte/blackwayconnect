-- Remaining RLS for tenant / module tables not covered in 20260101000002

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_rank_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Catalog / platform (read)
-- ---------------------------------------------------------------------------
CREATE POLICY onboarding_templates_read ON onboarding_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY onboarding_templates_anon_read ON onboarding_templates
  FOR SELECT TO anon USING (true);

CREATE POLICY promotions_read ON promotions
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY promotions_anon_read ON promotions
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY feature_flags_read ON feature_flags
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- Org-scoped billing (read for members; writes via service role)
-- ---------------------------------------------------------------------------
CREATE POLICY customer_add_ons_select ON customer_add_ons FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY invoices_select ON invoices FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY payments_select ON payments FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY service_orders_select ON service_orders FOR SELECT TO authenticated
  USING (organization_id IS NULL OR organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY service_order_payments_select ON service_order_payments FOR SELECT TO authenticated
  USING (service_order_id IN (
    SELECT id FROM service_orders WHERE organization_id IN (SELECT requesting_org_ids())
  ));

CREATE POLICY subscription_items_select ON subscription_items FOR SELECT TO authenticated
  USING (subscription_id IN (
    SELECT id FROM subscriptions WHERE organization_id IN (SELECT requesting_org_ids())
  ));

-- Stripe webhook inbox: no client access (service role only)
REVOKE ALL ON stripe_webhook_events FROM authenticated, anon;

-- App settings: platform admin only
CREATE POLICY app_settings_admin ON app_settings FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ---------------------------------------------------------------------------
-- Organization invitations
-- ---------------------------------------------------------------------------
CREATE POLICY org_invitations_select ON organization_invitations FOR SELECT TO authenticated
  USING (has_org_role(organization_id, 'admin'));
CREATE POLICY org_invitations_insert ON organization_invitations FOR INSERT TO authenticated
  WITH CHECK (has_org_role(organization_id, 'admin'));
CREATE POLICY org_invitations_delete ON organization_invitations FOR DELETE TO authenticated
  USING (has_org_role(organization_id, 'admin'));

-- ---------------------------------------------------------------------------
-- Project members
-- ---------------------------------------------------------------------------
CREATE POLICY project_members_select ON project_members FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT id FROM projects WHERE organization_id IN (SELECT requesting_org_ids())
  ));
CREATE POLICY project_members_write ON project_members FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM projects WHERE has_org_role(organization_id, 'admin')
  ))
  WITH CHECK (project_id IN (
    SELECT id FROM projects WHERE has_org_role(organization_id, 'admin')
  ));

-- ---------------------------------------------------------------------------
-- AI usage logs
-- ---------------------------------------------------------------------------
CREATE POLICY ai_usage_select ON ai_usage_logs FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY ai_usage_insert ON ai_usage_logs FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

-- ---------------------------------------------------------------------------
-- Websites
-- ---------------------------------------------------------------------------
CREATE POLICY websites_select ON websites FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY websites_insert ON websites FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT requesting_org_ids())
    AND org_within_limit(organization_id, 'max_websites')
  );
CREATE POLICY websites_update ON websites FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, 'member'));
CREATE POLICY websites_delete ON websites FOR DELETE TO authenticated
  USING (has_org_role(organization_id, 'admin'));

CREATE POLICY website_pages_select ON website_pages FOR SELECT TO authenticated
  USING (website_id IN (SELECT id FROM websites WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY website_pages_write ON website_pages FOR ALL TO authenticated
  USING (website_id IN (SELECT id FROM websites WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (website_id IN (SELECT id FROM websites WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY website_sections_select ON website_sections FOR SELECT TO authenticated
  USING (website_page_id IN (
    SELECT wp.id FROM website_pages wp
    JOIN websites w ON w.id = wp.website_id
    WHERE w.organization_id IN (SELECT requesting_org_ids())
  ));
CREATE POLICY website_sections_write ON website_sections FOR ALL TO authenticated
  USING (website_page_id IN (
    SELECT wp.id FROM website_pages wp
    JOIN websites w ON w.id = wp.website_id
    WHERE w.organization_id IN (SELECT requesting_org_ids())
  ))
  WITH CHECK (website_page_id IN (
    SELECT wp.id FROM website_pages wp
    JOIN websites w ON w.id = wp.website_id
    WHERE w.organization_id IN (SELECT requesting_org_ids())
  ));

CREATE POLICY website_forms_select ON website_forms FOR SELECT TO authenticated
  USING (website_id IN (SELECT id FROM websites WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY website_forms_write ON website_forms FOR ALL TO authenticated
  USING (website_id IN (SELECT id FROM websites WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (website_id IN (SELECT id FROM websites WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY website_deployments_select ON website_deployments FOR SELECT TO authenticated
  USING (website_id IN (SELECT id FROM websites WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY website_deployments_write ON website_deployments FOR ALL TO authenticated
  USING (website_id IN (SELECT id FROM websites WHERE has_org_role(organization_id, 'admin')))
  WITH CHECK (website_id IN (SELECT id FROM websites WHERE has_org_role(organization_id, 'admin')));

-- ---------------------------------------------------------------------------
-- SEO
-- ---------------------------------------------------------------------------
CREATE POLICY seo_campaigns_select ON seo_campaigns FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY seo_campaigns_insert ON seo_campaigns FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT requesting_org_ids())
    AND org_within_limit(organization_id, 'max_seo_campaigns')
  );
CREATE POLICY seo_campaigns_update ON seo_campaigns FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, 'member'));
CREATE POLICY seo_campaigns_delete ON seo_campaigns FOR DELETE TO authenticated
  USING (has_org_role(organization_id, 'admin'));

CREATE POLICY seo_audits_select ON seo_audits FOR SELECT TO authenticated
  USING (campaign_id IN (SELECT id FROM seo_campaigns WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY seo_audits_write ON seo_audits FOR ALL TO authenticated
  USING (campaign_id IN (SELECT id FROM seo_campaigns WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (campaign_id IN (SELECT id FROM seo_campaigns WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY seo_keywords_select ON seo_keywords FOR SELECT TO authenticated
  USING (campaign_id IN (SELECT id FROM seo_campaigns WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY seo_keywords_write ON seo_keywords FOR ALL TO authenticated
  USING (campaign_id IN (SELECT id FROM seo_campaigns WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (campaign_id IN (SELECT id FROM seo_campaigns WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY seo_recommendations_select ON seo_recommendations FOR SELECT TO authenticated
  USING (audit_id IN (
    SELECT a.id FROM seo_audits a
    JOIN seo_campaigns c ON c.id = a.campaign_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ));
CREATE POLICY seo_recommendations_write ON seo_recommendations FOR ALL TO authenticated
  USING (audit_id IN (
    SELECT a.id FROM seo_audits a
    JOIN seo_campaigns c ON c.id = a.campaign_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ))
  WITH CHECK (audit_id IN (
    SELECT a.id FROM seo_audits a
    JOIN seo_campaigns c ON c.id = a.campaign_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ));

CREATE POLICY seo_rank_snapshots_select ON seo_rank_snapshots FOR SELECT TO authenticated
  USING (keyword_id IN (
    SELECT k.id FROM seo_keywords k
    JOIN seo_campaigns c ON c.id = k.campaign_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ));
CREATE POLICY seo_rank_snapshots_write ON seo_rank_snapshots FOR ALL TO authenticated
  USING (keyword_id IN (
    SELECT k.id FROM seo_keywords k
    JOIN seo_campaigns c ON c.id = k.campaign_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ))
  WITH CHECK (keyword_id IN (
    SELECT k.id FROM seo_keywords k
    JOIN seo_campaigns c ON c.id = k.campaign_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ));

-- ---------------------------------------------------------------------------
-- Chatbots
-- ---------------------------------------------------------------------------
CREATE POLICY chatbots_select ON chatbots FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY chatbots_insert ON chatbots FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT requesting_org_ids())
    AND org_within_limit(organization_id, 'max_chatbots')
  );
CREATE POLICY chatbots_update ON chatbots FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, 'member'));
CREATE POLICY chatbots_delete ON chatbots FOR DELETE TO authenticated
  USING (has_org_role(organization_id, 'admin'));

CREATE POLICY chatbot_sources_select ON chatbot_sources FOR SELECT TO authenticated
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY chatbot_sources_write ON chatbot_sources FOR ALL TO authenticated
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY chatbot_rules_select ON chatbot_rules FOR SELECT TO authenticated
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY chatbot_rules_write ON chatbot_rules FOR ALL TO authenticated
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY chatbot_conversations_select ON chatbot_conversations FOR SELECT TO authenticated
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY chatbot_conversations_write ON chatbot_conversations FOR ALL TO authenticated
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY chatbot_messages_select ON chatbot_messages FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT cc.id FROM chatbot_conversations cc
    JOIN chatbots c ON c.id = cc.chatbot_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ));
CREATE POLICY chatbot_messages_write ON chatbot_messages FOR ALL TO authenticated
  USING (conversation_id IN (
    SELECT cc.id FROM chatbot_conversations cc
    JOIN chatbots c ON c.id = cc.chatbot_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ))
  WITH CHECK (conversation_id IN (
    SELECT cc.id FROM chatbot_conversations cc
    JOIN chatbots c ON c.id = cc.chatbot_id
    WHERE c.organization_id IN (SELECT requesting_org_ids())
  ));

CREATE POLICY chatbot_leads_select ON chatbot_leads FOR SELECT TO authenticated
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY chatbot_leads_write ON chatbot_leads FOR ALL TO authenticated
  USING (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (chatbot_id IN (SELECT id FROM chatbots WHERE organization_id IN (SELECT requesting_org_ids())));

-- ---------------------------------------------------------------------------
-- Business CRM
-- ---------------------------------------------------------------------------
CREATE POLICY clients_select ON clients FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY clients_write ON clients FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY contacts_select ON contacts FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY contacts_write ON contacts FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY business_notes_select ON business_notes FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY business_notes_write ON business_notes FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY business_pipeline_stages_select ON business_pipeline_stages FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY business_pipeline_stages_write ON business_pipeline_stages FOR ALL TO authenticated
  USING (has_org_role(organization_id, 'admin'))
  WITH CHECK (has_org_role(organization_id, 'admin'));

CREATE POLICY business_deals_select ON business_deals FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY business_deals_write ON business_deals FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY business_reminders_select ON business_reminders FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY business_reminders_write ON business_reminders FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY quote_items_select ON quote_items FOR SELECT TO authenticated
  USING (quote_id IN (SELECT id FROM quotes WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY quote_items_write ON quote_items FOR ALL TO authenticated
  USING (quote_id IN (SELECT id FROM quotes WHERE has_org_role(organization_id, 'member')))
  WITH CHECK (quote_id IN (SELECT id FROM quotes WHERE has_org_role(organization_id, 'member')));

CREATE POLICY business_invoices_select ON business_invoices FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY business_invoices_write ON business_invoices FOR ALL TO authenticated
  USING (has_org_role(organization_id, 'admin'))
  WITH CHECK (has_org_role(organization_id, 'admin'));

CREATE POLICY business_invoice_items_select ON business_invoice_items FOR SELECT TO authenticated
  USING (business_invoice_id IN (
    SELECT id FROM business_invoices WHERE organization_id IN (SELECT requesting_org_ids())
  ));
CREATE POLICY business_invoice_items_write ON business_invoice_items FOR ALL TO authenticated
  USING (business_invoice_id IN (
    SELECT id FROM business_invoices WHERE has_org_role(organization_id, 'admin')
  ))
  WITH CHECK (business_invoice_id IN (
    SELECT id FROM business_invoices WHERE has_org_role(organization_id, 'admin')
  ));

CREATE POLICY studio_contracts_select ON studio_contracts FOR SELECT TO authenticated
  USING (quote_id IN (SELECT id FROM quotes WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY studio_contracts_write ON studio_contracts FOR ALL TO authenticated
  USING (quote_id IN (SELECT id FROM quotes WHERE has_org_role(organization_id, 'admin')))
  WITH CHECK (quote_id IN (SELECT id FROM quotes WHERE has_org_role(organization_id, 'admin')));

-- ---------------------------------------------------------------------------
-- Documents & notifications
-- ---------------------------------------------------------------------------
CREATE POLICY documents_select ON documents FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY documents_insert ON documents FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY documents_update ON documents FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, 'member'));
CREATE POLICY documents_delete ON documents FOR DELETE TO authenticated
  USING (has_org_role(organization_id, 'admin'));

CREATE POLICY notifications_select ON notifications FOR SELECT TO authenticated
  USING (profile_id = requesting_profile_id());
CREATE POLICY notifications_update ON notifications FOR UPDATE TO authenticated
  USING (profile_id = requesting_profile_id());

-- ---------------------------------------------------------------------------
-- Social (org-scoped; oauth tokens remain revoked in 00002)
-- ---------------------------------------------------------------------------
CREATE POLICY social_accounts_select ON social_accounts FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY social_accounts_write ON social_accounts FOR ALL TO authenticated
  USING (has_org_role(organization_id, 'admin'))
  WITH CHECK (has_org_role(organization_id, 'admin'));

CREATE POLICY social_campaigns_select ON social_campaigns FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY social_campaigns_write ON social_campaigns FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY social_posts_select ON social_posts FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));
CREATE POLICY social_posts_write ON social_posts FOR ALL TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()))
  WITH CHECK (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY social_post_variants_select ON social_post_variants FOR SELECT TO authenticated
  USING (post_id IN (SELECT id FROM social_posts WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY social_post_variants_write ON social_post_variants FOR ALL TO authenticated
  USING (post_id IN (SELECT id FROM social_posts WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (post_id IN (SELECT id FROM social_posts WHERE organization_id IN (SELECT requesting_org_ids())));

CREATE POLICY social_schedules_select ON social_schedules FOR SELECT TO authenticated
  USING (variant_id IN (
    SELECT v.id FROM social_post_variants v
    JOIN social_posts p ON p.id = v.post_id
    WHERE p.organization_id IN (SELECT requesting_org_ids())
  ));
CREATE POLICY social_schedules_write ON social_schedules FOR ALL TO authenticated
  USING (variant_id IN (
    SELECT v.id FROM social_post_variants v
    JOIN social_posts p ON p.id = v.post_id
    WHERE p.organization_id IN (SELECT requesting_org_ids())
  ))
  WITH CHECK (variant_id IN (
    SELECT v.id FROM social_post_variants v
    JOIN social_posts p ON p.id = v.post_id
    WHERE p.organization_id IN (SELECT requesting_org_ids())
  ));

CREATE POLICY social_analytics_select ON social_analytics FOR SELECT TO authenticated
  USING (variant_id IN (
    SELECT v.id FROM social_post_variants v
    JOIN social_posts p ON p.id = v.post_id
    WHERE p.organization_id IN (SELECT requesting_org_ids())
  ));

CREATE POLICY social_publish_logs_select ON social_publish_logs FOR SELECT TO authenticated
  USING (organization_id IN (SELECT requesting_org_ids()));

CREATE POLICY social_approval_requests_select ON social_approval_requests FOR SELECT TO authenticated
  USING (post_id IN (SELECT id FROM social_posts WHERE organization_id IN (SELECT requesting_org_ids())));
CREATE POLICY social_approval_requests_write ON social_approval_requests FOR ALL TO authenticated
  USING (post_id IN (SELECT id FROM social_posts WHERE organization_id IN (SELECT requesting_org_ids())))
  WITH CHECK (post_id IN (SELECT id FROM social_posts WHERE organization_id IN (SELECT requesting_org_ids())));

-- ---------------------------------------------------------------------------
-- Observability
-- ---------------------------------------------------------------------------
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT TO authenticated
  USING (
    is_platform_admin()
    OR (organization_id IS NOT NULL AND has_org_role(organization_id, 'admin'))
  );

CREATE POLICY error_logs_admin ON error_logs FOR SELECT TO authenticated
  USING (is_platform_admin());
