-- RLS policy / helper assertions for NoirRoutes
-- Run with: supabase test db
--   or: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_policies.test.sql
--
-- These DO blocks document expected helpers and policies so CI fails if they drift.

BEGIN;

-- requesting_clerk_user_id exists and is callable
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'requesting_clerk_user_id'
  ), 'requesting_clerk_user_id() must exist';
  -- Smoke-call (returns NULL outside a JWT context)
  PERFORM requesting_clerk_user_id();
END $$;

-- Limit / admin helpers exist
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'org_effective_limit'
  ), 'org_effective_limit() must exist';

  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'org_within_limit'
  ), 'org_within_limit() must exist';

  ASSERT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_platform_admin'
  ), 'is_platform_admin() must exist';
END $$;

-- social_oauth_tokens: authenticated must not have privileges (REVOKE documented)
DO $$
DECLARE
  privs TEXT;
BEGIN
  SELECT COALESCE(string_agg(privilege_type, ','), '')
  INTO privs
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'social_oauth_tokens'
    AND grantee = 'authenticated';

  ASSERT privs = '' OR privs IS NULL,
    format('social_oauth_tokens must REVOKE ALL FROM authenticated; found: %s', privs);
END $$;

-- Catalog tables are readable via policies for authenticated (and anon where public)
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'plans_read'
  ), 'plans_read policy must exist';
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_prices' AND policyname = 'plan_prices_read'
  ), 'plan_prices_read policy must exist';
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'add_ons' AND policyname = 'add_ons_read'
  ), 'add_ons_read policy must exist';
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_offers' AND policyname = 'service_offers_read'
  ), 'service_offers_read policy must exist';
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'social_platforms' AND policyname = 'social_platforms_read'
  ), 'social_platforms_read policy must exist';
END $$;

-- Commerce extras policies (from 20260101000004)
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customer_add_ons' AND policyname = 'customer_add_ons_select'
  ), 'customer_add_ons_select policy must exist';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_order_payments' AND policyname = 'service_order_payments_select'
  ), 'service_order_payments_select policy must exist';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'documents_select'
  ), 'documents_select policy must exist';

  ASSERT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select'
  ), 'notifications_select policy must exist';
END $$;

-- organizations.deleted_at / profiles.deleted_at for soft-delete sync
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'deleted_at'
  ), 'organizations.deleted_at must exist for Clerk organization.deleted soft-delete';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_at'
  ), 'profiles.deleted_at must exist for Clerk user.deleted soft-delete';
END $$;

-- Storage buckets exist
DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'org-documents'), 'org-documents bucket';
  ASSERT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'org-assets'), 'org-assets bucket';
  ASSERT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chatbot-kb'), 'chatbot-kb bucket';
END $$;

COMMIT;
