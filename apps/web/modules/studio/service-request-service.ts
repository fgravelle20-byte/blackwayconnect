import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function createServiceRequest(input: {
  contact_name: string;
  contact_email: string;
  company?: string;
  service_type?: string;
  description: string;
  organization_id?: string;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb.from("service_requests").insert({ ...input, status: "new" }).select("id").single();
  if (error) throw error;
  return data;
}
