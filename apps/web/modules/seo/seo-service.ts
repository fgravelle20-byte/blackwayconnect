import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type SeoCampaignInput = {
  organization_id: string;
  name: string;
  project_id?: string | null;
};

export async function listSeoCampaigns(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("seo_campaigns")
    .select("id, name, project_id, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSeoCampaign(input: SeoCampaignInput) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("seo_campaigns")
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      project_id: input.project_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSeoCampaign(
  id: string,
  organizationId: string,
  patch: { name?: string; project_id?: string | null },
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("seo_campaigns")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteSeoCampaign(id: string, organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("seo_campaigns")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}
