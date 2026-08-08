import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function listTickets(orgId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb.from("support_tickets").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
  return data ?? [];
}
