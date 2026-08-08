import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function fetchCatalog() {
  const sb = createAdminSupabaseClient();
  const [{ data: plans }, { data: addOns }, { data: serviceOffers }] = await Promise.all([
    sb.from("plans").select("*, plan_prices(*), plan_limits(*), plan_features(*)").eq("is_active", true).order("sort_order"),
    sb.from("add_ons").select("*, add_on_prices(*)").eq("is_active", true),
    sb.from("service_offers").select("*").eq("is_active", true),
  ]);
  return { plans: plans ?? [], addOns: addOns ?? [], serviceOffers: serviceOffers ?? [] };
}
