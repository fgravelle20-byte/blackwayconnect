import type { OrgRole } from "@noirroutes/database";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getProfileByClerkId(clerkUserId: string) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();
  return data;
}

export async function getOrgMembership(profileId: string, orgId: string) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role")
    .eq("profile_id", profileId)
    .eq("organization_id", orgId)
    .single();
  return data;
}

export function hasOrgRole(role: OrgRole, allowed: OrgRole[]): boolean {
  return allowed.includes(role);
}

export async function isPlatformAdmin(profileId: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return !!data;
}

/** Prefer active subscription → plan; fall back to organizations.plan_tier. */
async function resolveOrgPlanId(orgId: string): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, status")
    .eq("organization_id", orgId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub?.plan_id) return sub.plan_id as string;

  const { data: org } = await supabase
    .from("organizations")
    .select("plan_tier")
    .eq("id", orgId)
    .maybeSingle();
  if (!org?.plan_tier) return null;

  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("tier", org.plan_tier)
    .maybeSingle();

  return (plan?.id as string) ?? null;
}

export async function orgHasFeature(orgId: string, featureKey: string): Promise<boolean> {
  if (!featureKey) return false;
  const supabase = createAdminSupabaseClient();
  const planId = await resolveOrgPlanId(orgId);

  if (planId) {
    const { data: feature } = await supabase
      .from("plan_features")
      .select("enabled")
      .eq("plan_id", planId)
      .eq("feature_key", featureKey)
      .maybeSingle();
    if (feature?.enabled) return true;
  }

  // À-la-carte modules / packs: active customer_add_ons that unlock this feature
  const { data: addOns } = await supabase
    .from("customer_add_ons")
    .select("add_ons(unlocks_feature)")
    .eq("organization_id", orgId)
    .eq("status", "active");

  for (const row of addOns ?? []) {
    const addon = row.add_ons as
      | { unlocks_feature: string | null }
      | { unlocks_feature: string | null }[]
      | null;
    const meta = Array.isArray(addon) ? addon[0] : addon;
    if (meta?.unlocks_feature === featureKey) return true;
  }

  return false;
}

/** Feature flag OR positive plan/addon limit — used to open module UIs. */
export async function orgCanAccessModule(
  orgId: string,
  featureKey: string,
  limitKey?: string,
): Promise<boolean> {
  if (await orgHasFeature(orgId, featureKey)) return true;
  if (!limitKey) return false;
  const limit = await orgEffectiveLimit(orgId, limitKey);
  return limit === -1 || limit > 0;
}

export async function getOrgLimit(orgId: string, limitKey: string): Promise<number> {
  const supabase = createAdminSupabaseClient();
  const planId = await resolveOrgPlanId(orgId);
  if (!planId) return 0;

  const { data: limit } = await supabase
    .from("plan_limits")
    .select("value_int")
    .eq("plan_id", planId)
    .eq("limit_key", limitKey)
    .maybeSingle();

  return (limit?.value_int as number) ?? 0;
}

/** Plan limit plus active customer_add_ons increments for the same limit_key. */
export async function orgEffectiveLimit(orgId: string, limitKey: string): Promise<number> {
  const base = await getOrgLimit(orgId, limitKey);
  if (base === -1) return -1;

  const supabase = createAdminSupabaseClient();
  const { data: addOns } = await supabase
    .from("customer_add_ons")
    .select("quantity, add_ons(limit_key, increment_value)")
    .eq("organization_id", orgId)
    .eq("status", "active");

  let bonus = 0;
  for (const row of addOns ?? []) {
    const addon = row.add_ons as
      | { limit_key: string | null; increment_value: number | null }
      | { limit_key: string | null; increment_value: number | null }[]
      | null;
    const meta = Array.isArray(addon) ? addon[0] : addon;
    if (!meta?.limit_key || meta.limit_key !== limitKey) continue;
    const qty = (row.quantity as number) ?? 1;
    bonus += (meta.increment_value ?? 0) * qty;
  }

  return base + bonus;
}
