import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { LeadSource, LeadStatus } from "./index";

export type LeadInput = {
  organization_id: string;
  source?: LeadSource;
  status?: LeadStatus;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  score?: number;
  metadata?: Record<string, unknown>;
  assigned_profile_id?: string | null;
  chatbot_lead_id?: string | null;
  service_request_id?: string | null;
};

export async function listLeads(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createLead(input: LeadInput) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("leads")
    .insert({
      organization_id: input.organization_id,
      source: input.source ?? "manual",
      status: input.status ?? "new",
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      company: input.company ?? null,
      score: input.score ?? 0,
      metadata: input.metadata ?? {},
      assigned_profile_id: input.assigned_profile_id ?? null,
      chatbot_lead_id: input.chatbot_lead_id ?? null,
      service_request_id: input.service_request_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  await sb.from("lead_activities").insert({
    lead_id: data.id,
    organization_id: input.organization_id,
    activity_type: "created",
    content: `Lead created from ${input.source ?? "manual"}`,
    metadata: {},
  });

  return data;
}

export async function updateLead(
  id: string,
  organizationId: string,
  patch: Partial<Omit<LeadInput, "organization_id">>,
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("leads")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteLead(id: string, organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

/** Upsert a lead from a Studio quote / service request (idempotent on service_request_id). */
export async function upsertLeadFromServiceRequest(input: {
  organization_id?: string | null;
  service_request_id: string;
  name: string;
  email: string;
  company?: string | null;
  description?: string;
}) {
  if (!input.organization_id) return null;
  const sb = createAdminSupabaseClient();
  const { data: existing } = await sb
    .from("leads")
    .select("id")
    .eq("service_request_id", input.service_request_id)
    .maybeSingle();
  if (existing) return existing;

  return createLead({
    organization_id: input.organization_id,
    source: "quote_request",
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    metadata: { description: input.description ?? null },
    service_request_id: input.service_request_id,
  });
}

/** Promote a chatbot_leads row into the first-class leads table. */
export async function upsertLeadFromChatbotLead(input: {
  organization_id: string;
  chatbot_lead_id: string;
  email?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const sb = createAdminSupabaseClient();
  const { data: existing } = await sb
    .from("leads")
    .select("id")
    .eq("chatbot_lead_id", input.chatbot_lead_id)
    .maybeSingle();
  if (existing) return existing;

  return createLead({
    organization_id: input.organization_id,
    source: "chatbot",
    email: input.email ?? null,
    name: input.name ?? null,
    metadata: input.metadata ?? {},
    chatbot_lead_id: input.chatbot_lead_id,
  });
}
