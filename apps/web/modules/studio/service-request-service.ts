import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { upsertLeadFromServiceRequest } from "@/modules/leads/lead-service";

export type ServiceRequestStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "in_progress"
  | "completed"
  | "cancelled";

export async function listServiceRequests(limit = 50) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createServiceRequest(input: {
  contact_name: string;
  contact_email: string;
  company?: string;
  service_type?: string;
  description: string;
  organization_id?: string;
  locale?: string;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("service_requests")
    .insert({ ...input, status: "new" })
    .select("*")
    .single();
  if (error) throw error;

  // Wire quote requests into first-class Leads when an org is known
  await upsertLeadFromServiceRequest({
    organization_id: input.organization_id ?? data.organization_id,
    service_request_id: data.id,
    name: input.contact_name,
    email: input.contact_email,
    company: input.company,
    description: input.description,
  }).catch(() => null);

  return data;
}

export async function updateServiceRequest(
  id: string,
  patch: {
    status?: ServiceRequestStatus;
    description?: string;
    service_type?: string | null;
    company?: string | null;
  },
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("service_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteServiceRequest(id: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb.from("service_requests").delete().eq("id", id);
  if (error) throw error;
}
