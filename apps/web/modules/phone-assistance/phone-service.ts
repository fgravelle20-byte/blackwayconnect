import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type PhoneAssistantStatus =
  | "draft"
  | "active"
  | "paused"
  | "integration_required";

export async function listPhoneAssistants(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("phone_assistants")
    .select("id, name, status, provider, config, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPhoneAssistant(input: {
  organization_id: string;
  name: string;
  config?: Record<string, unknown>;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("phone_assistants")
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      status: "draft",
      provider: null,
      config: input.config ?? { greeting: "Thanks for calling. How can we help?" },
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updatePhoneAssistant(
  id: string,
  organizationId: string,
  patch: {
    name?: string;
    status?: PhoneAssistantStatus;
    config?: Record<string, unknown>;
  },
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("phone_assistants")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deletePhoneAssistant(id: string, organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("phone_assistants")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}
