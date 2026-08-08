import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureDefaultPipeline } from "@/modules/business/business-service";
import { createWebsite } from "@/modules/website-builder/website-service";
import { orgCanAccessModule } from "@/lib/permissions";

/**
 * End-to-end autonomous bootstrap after onboarding:
 * claim conversion leads → pipeline → optional starter website.
 */
export async function bootstrapOrganizationJourney(input: {
  organization_id: string;
  profile_email?: string | null;
  org_name: string;
}) {
  const sb = createAdminSupabaseClient();
  const result = {
    claimed_leads: 0,
    pipeline_seeded: false,
    starter_website: false,
  };

  // 1) Claim orphan conversion leads matching this email
  if (input.profile_email) {
    const { data: claimed } = await sb
      .from("leads")
      .update({ organization_id: input.organization_id })
      .is("organization_id", null)
      .eq("email", input.profile_email)
      .select("id");
    result.claimed_leads = claimed?.length ?? 0;
  }

  // 2) Business pipeline ready
  await ensureDefaultPipeline(input.organization_id);
  result.pipeline_seeded = true;

  // 3) Starter website if module unlocked by plan/addon
  const canWeb = await orgCanAccessModule(
    input.organization_id,
    "has_website_builder",
    "max_websites",
  );
  if (canWeb) {
    const { count } = await sb
      .from("websites")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", input.organization_id);
    if ((count ?? 0) === 0) {
      await createWebsite({
        organization_id: input.organization_id,
        name: `${input.org_name} — Site`,
        status: "draft",
      });
      result.starter_website = true;
    }
  }

  return result;
}

/** Claim all orphan chatbot leads for an org (admin/operator action). */
export async function claimConversionLeads(
  organizationId: string,
  opts?: { email?: string | null; limit?: number },
) {
  const sb = createAdminSupabaseClient();
  let q = sb
    .from("leads")
    .update({ organization_id: organizationId })
    .is("organization_id", null)
    .eq("source", "chatbot")
    .select("id");

  if (opts?.email) {
    q = q.eq("email", opts.email);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
