import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getOnboardingProgress(orgId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb.from("onboarding_progress").select("*").eq("organization_id", orgId);
  return data ?? [];
}

export async function markStepComplete(orgId: string, stepKey: string, data: Record<string, unknown> = {}) {
  const sb = createAdminSupabaseClient();
  await sb.from("onboarding_progress").upsert(
    { organization_id: orgId, step_key: stepKey, completed_at: new Date().toISOString(), data },
    { onConflict: "organization_id,step_key" },
  );
}
