import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getOrganizationByClerkId(clerkOrgId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb.from("organizations").select("*").eq("clerk_org_id", clerkOrgId).maybeSingle();
  return data;
}

export async function getOrganizationMembers(orgId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("organization_members")
    .select("role, profiles(id, email, full_name)")
    .eq("organization_id", orgId);
  return data ?? [];
}
