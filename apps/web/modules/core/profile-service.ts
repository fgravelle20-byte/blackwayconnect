import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getProfileByClerkUserId(clerkUserId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb.from("profiles").select("*").eq("clerk_user_id", clerkUserId).maybeSingle();
  return data;
}
