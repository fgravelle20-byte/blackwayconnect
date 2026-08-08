import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type WebsiteStatus = "draft" | "preview" | "published" | "deployment_required";

export type WebsiteInput = {
  organization_id: string;
  name: string;
  status?: WebsiteStatus;
  project_id?: string | null;
  preview_url?: string | null;
};

export async function listWebsites(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("websites")
    .select("id, name, status, preview_url, deployment_status, project_id, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createWebsite(input: WebsiteInput) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("websites")
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      status: input.status ?? "draft",
      project_id: input.project_id ?? null,
      preview_url: input.preview_url ?? null,
      deployment_status: "planned",
    })
    .select("*")
    .single();
  if (error) throw error;

  // Seed a home page so the site is immediately editable in the engine
  await sb.from("website_pages").insert({
    website_id: data.id,
    slug: "home",
    title: "Home",
    seo_meta: {},
    content: { blocks: [] },
    sort_order: 0,
  });

  return data;
}

export async function updateWebsite(
  id: string,
  organizationId: string,
  patch: Partial<Pick<WebsiteInput, "name" | "status" | "preview_url" | "project_id">>,
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("websites")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteWebsite(id: string, organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("websites")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}
