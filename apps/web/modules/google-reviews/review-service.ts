import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ReviewCampaignStatus =
  | "planned"
  | "active"
  | "paused"
  | "completed"
  | "integration_required";

export async function listReviewCampaigns(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("review_campaigns")
    .select("id, name, status, google_location_id, config, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createReviewCampaign(input: {
  organization_id: string;
  name: string;
  config?: Record<string, unknown>;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("review_campaigns")
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      status: "planned",
      google_location_id: null,
      config: input.config ?? { channel: "email", suggestion_mode: "suggestion_only" },
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateReviewCampaign(
  id: string,
  organizationId: string,
  patch: { name?: string; status?: ReviewCampaignStatus; config?: Record<string, unknown> },
) {
  const sb = createAdminSupabaseClient();
  // Never allow auto-posting fabrications — google_location_id stays null until API wired
  const { data, error } = await sb
    .from("review_campaigns")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteReviewCampaign(id: string, organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("review_campaigns")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

/** Create a review request + AI suggestion text (suggestion_only — never posted). */
export async function createReviewRequestWithSuggestion(input: {
  campaign_id: string;
  organization_id: string;
  customer_contact: string;
  customer_name?: string | null;
  suggestion: string;
}) {
  const sb = createAdminSupabaseClient();
  const { data: campaign } = await sb
    .from("review_campaigns")
    .select("id")
    .eq("id", input.campaign_id)
    .eq("organization_id", input.organization_id)
    .maybeSingle();
  if (!campaign) throw new Error("campaign_not_found");

  const { data: request, error } = await sb
    .from("review_requests")
    .insert({
      campaign_id: input.campaign_id,
      customer_contact: input.customer_contact,
      customer_name: input.customer_name ?? null,
      status: "draft",
    })
    .select("*")
    .single();
  if (error || !request) throw error ?? new Error("request_failed");

  await sb.from("generated_review_suggestions").insert({
    request_id: request.id,
    content: input.suggestion,
    status: "suggestion_only",
  });

  return request;
}
