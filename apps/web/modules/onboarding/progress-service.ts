import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type OnboardingTemplateStep = {
  step_key: string;
  sort_order: number;
  plan_tier: string;
};

function fallbackTemplates(planTier: string): OnboardingTemplateStep[] {
  return [
    { step_key: "welcome", sort_order: 1, plan_tier: planTier },
    { step_key: "organization", sort_order: 2, plan_tier: planTier },
    { step_key: "goals", sort_order: 3, plan_tier: planTier },
    { step_key: "complete", sort_order: 4, plan_tier: planTier },
  ];
}

function hasSupabaseAdmin(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function getOnboardingProgress(orgId: string) {
  if (!hasSupabaseAdmin()) return [];
  const sb = createAdminSupabaseClient();
  const { data } = await sb.from("onboarding_progress").select("*").eq("organization_id", orgId);
  return data ?? [];
}

export async function isOnboardingComplete(orgId: string): Promise<boolean> {
  if (!hasSupabaseAdmin()) return false;
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("onboarding_progress")
    .select("id")
    .eq("organization_id", orgId)
    .eq("step_key", "completed")
    .maybeSingle();
  return Boolean(data);
}

export async function getOnboardingTemplates(
  planTier = "starter",
): Promise<OnboardingTemplateStep[]> {
  if (!hasSupabaseAdmin()) return fallbackTemplates(planTier);

  try {
    const sb = createAdminSupabaseClient();
    const { data } = await sb
      .from("onboarding_templates")
      .select("step_key, sort_order, plan_tier")
      .eq("plan_tier", planTier)
      .order("sort_order", { ascending: true });

    if (data && data.length > 0) return data;
  } catch {
    // Fall through to defaults when Supabase is misconfigured
  }

  return fallbackTemplates(planTier);
}

export async function getOrgPlanTier(orgId: string): Promise<string> {
  if (!hasSupabaseAdmin()) return "starter";

  try {
    const sb = createAdminSupabaseClient();
    const { data: org } = await sb
      .from("organizations")
      .select("plan_tier, id")
      .eq("id", orgId)
      .maybeSingle();

    if (org?.plan_tier && org.plan_tier !== "starter") {
      return org.plan_tier;
    }

    const { data: sub } = await sb
      .from("subscriptions")
      .select("plan_id, plans(tier)")
      .eq("organization_id", orgId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const plans = sub?.plans as { tier?: string } | { tier?: string }[] | null | undefined;
    const tier = Array.isArray(plans) ? plans[0]?.tier : plans?.tier;
    return tier || org?.plan_tier || "starter";
  } catch {
    return "starter";
  }
}

export async function orgHasActiveSubscription(orgId: string): Promise<boolean> {
  if (!hasSupabaseAdmin()) return false;

  try {
    const sb = createAdminSupabaseClient();
    const { data } = await sb
      .from("subscriptions")
      .select("id")
      .eq("organization_id", orgId)
      .in("status", ["active", "trialing"])
      .limit(1)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function markStepComplete(
  orgId: string,
  stepKey: string,
  data: Record<string, unknown> = {},
) {
  if (!hasSupabaseAdmin()) return;
  const sb = createAdminSupabaseClient();
  await sb.from("onboarding_progress").upsert(
    {
      organization_id: orgId,
      step_key: stepKey,
      completed_at: new Date().toISOString(),
      data,
    },
    { onConflict: "organization_id,step_key" },
  );
}
