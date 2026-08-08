import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function listClients(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("clients")
    .select("id, name, email, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createClient(input: {
  organization_id: string;
  name: string;
  email?: string | null;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("clients")
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      email: input.email ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(
  id: string,
  organizationId: string,
  patch: { name?: string; email?: string | null },
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("clients")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteClient(id: string, organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

export async function listDeals(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("business_deals")
    .select("id, title, value_cents, client_id, stage_id")
    .eq("organization_id", organizationId)
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export async function createDeal(input: {
  organization_id: string;
  title: string;
  value_cents?: number;
  client_id?: string | null;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("business_deals")
    .insert({
      organization_id: input.organization_id,
      title: input.title,
      value_cents: input.value_cents ?? 0,
      client_id: input.client_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Seed default pipeline stages once per org (idempotent). */
export async function ensureDefaultPipeline(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { count } = await sb
    .from("business_pipeline_stages")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if ((count ?? 0) > 0) return;

  await sb.from("business_pipeline_stages").insert([
    { organization_id: organizationId, name: "New", sort_order: 0 },
    { organization_id: organizationId, name: "Qualified", sort_order: 1 },
    { organization_id: organizationId, name: "Proposal", sort_order: 2 },
    { organization_id: organizationId, name: "Won", sort_order: 3 },
  ]);
}
