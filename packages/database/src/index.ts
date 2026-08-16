export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrgRole = "owner" | "admin" | "member" | "client";
export type PlanTier =
  | "starter"
  | "growth"
  | "business"
  | "scale"
  | "agency"
  | "enterprise";
export type BillingInterval = "month" | "year";

export interface PlanPrice {
  id: string;
  plan_id: string;
  stripe_price_id: string | null;
  interval: BillingInterval;
  amount_cents: number;
  currency: string;
  annual_discount_percent: number;
  is_active: boolean;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  enabled: boolean;
}

export interface PlanLimit {
  id: string;
  plan_id: string;
  limit_key: string;
  value_int: number;
}

export interface Plan {
  id: string;
  tier: PlanTier;
  slug: string;
  name: string;
  description: string | null;
  stripe_product_id: string | null;
  is_active: boolean;
  is_public: boolean;
  trial_days: number;
  sort_order: number;
}

export interface AddOn {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string;
  limit_key: string | null;
  increment_value: number;
  is_active: boolean;
  category?: string | null;
  unlocks_feature?: string | null;
  sort_order?: number | null;
  is_public?: boolean | null;
  headline?: string | null;
  badge?: string | null;
  applies_to_plan_tier?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AddOnPrice {
  id: string;
  add_on_id: string;
  stripe_price_id: string | null;
  interval: "month" | "year" | null;
  amount_cents: number;
  is_active: boolean;
}

export type CatalogAddOn = AddOn & {
  prices: AddOnPrice[];
};

export interface ServiceOffer {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pricing_model: string;
  base_price_cents: number | null;
  is_active: boolean;
  sort_order: number;
}

export type CatalogPlan = Plan & {
  prices: PlanPrice[];
  features: PlanFeature[];
  limits: PlanLimit[];
};

export interface CommerceCatalog {
  plans: CatalogPlan[];
  add_ons: CatalogAddOn[];
  service_offers: ServiceOffer[];
  /** @deprecated use add_ons */
  addOns?: CatalogAddOn[];
  /** @deprecated use service_offers */
  serviceOffers?: ServiceOffer[];
}

export type Profile = {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: string;
};

/**
 * Placeholder only — do not pass to createClient&lt;Database&gt; until generated.
 * Use untyped SupabaseClient in Phase 1.
 */
export type Database = any;

export const LIMIT_KEYS = [
  "max_projects",
  "max_websites",
  "max_pages_per_website",
  "max_ai_generations_per_month",
  "max_seo_campaigns",
  "max_seo_audits_per_month",
  "max_chatbots",
  "max_chatbot_conversations",
  "max_social_accounts",
  "max_social_posts_per_month",
  "max_team_members",
  "max_storage_mb",
  "max_agency_clients",
] as const;

export const FEATURE_KEYS = [
  "has_client_portal",
  "has_business_management",
  "has_social_distribution",
  "has_advanced_analytics",
  "has_white_label",
  "has_agency_tools",
  "has_priority_support",
  "has_custom_integrations",
] as const;
