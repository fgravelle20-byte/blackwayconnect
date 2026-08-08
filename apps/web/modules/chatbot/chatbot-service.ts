import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ChatbotInput = {
  organization_id: string;
  name: string;
  project_id?: string | null;
  widget_config?: Record<string, unknown>;
};

export async function listChatbots(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("chatbots")
    .select("id, name, widget_config, project_id, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createChatbot(input: ChatbotInput) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("chatbots")
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      project_id: input.project_id ?? null,
      widget_config: input.widget_config ?? { welcome: "Hi — how can we help?" },
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateChatbot(
  id: string,
  organizationId: string,
  patch: { name?: string; widget_config?: Record<string, unknown>; project_id?: string | null },
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("chatbots")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteChatbot(id: string, organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("chatbots")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}
