# Schema overview

See migrations in `supabase/migrations/` for the source of truth.

## Domains

| Domain | Tables |
|--------|--------|
| Identity | `profiles`, `organizations`, `organization_members`, `organization_invitations` |
| Commerce | `plans`, `plan_prices`, `plan_limits`, `plan_features`, `subscriptions`, `subscription_items`, `subscription_usage`, `add_ons`, `add_on_prices`, `customer_add_ons`, `service_offers`, `service_orders`, `service_order_payments`, `promotions`, `invoices`, `payments`, `stripe_webhook_events` |
| Projects | `projects`, `project_members`, `ai_usage_logs` |
| Website | `websites`, `website_pages`, `website_sections`, `website_forms`, `website_deployments` |
| SEO | `seo_campaigns`, `seo_audits`, `seo_keywords`, `seo_recommendations`, `seo_rank_snapshots` |
| Chatbot | `chatbots`, `chatbot_sources`, `chatbot_rules`, `chatbot_conversations`, `chatbot_messages`, `chatbot_leads` |
| Business | `clients`, `contacts`, `business_notes`, `business_pipeline_stages`, `business_deals`, `business_reminders` |
| Studio | `service_requests`, `quotes`, `quote_items`, `business_invoices`, `business_invoice_items`, `studio_contracts` |
| Support | `support_tickets`, `support_messages` |
| Docs / notify | `documents`, `notifications` |
| Social | `social_platforms`, `social_accounts`, `social_oauth_tokens`, `social_campaigns`, `social_posts`, `social_post_variants`, `social_schedules`, `social_analytics`, `social_publish_logs`, `social_approval_requests` |
| Platform | `platform_admins`, `app_settings`, `feature_flags`, `audit_logs`, `error_logs`, `onboarding_templates`, `onboarding_progress` |

## Pricing rule

All Stripe `price_id` values live in DB (`plan_prices`, `add_on_prices`). Never put them in `.env`.
