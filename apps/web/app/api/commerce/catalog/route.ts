import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const publicOnly = url.searchParams.get("public") !== "0";

    const sb = createAdminSupabaseClient();
    let plansQuery = sb.from("plans").select("*").eq("is_active", true).order("sort_order");
    if (publicOnly) {
      plansQuery = plansQuery.eq("is_public", true);
    }

    const [
      { data: plans, error: plansError },
      { data: prices },
      { data: features },
      { data: limits },
      { data: addOns },
      { data: addOnPrices },
      { data: offers },
    ] = await Promise.all([
      plansQuery,
      sb.from("plan_prices").select("*").eq("is_active", true),
      sb.from("plan_features").select("*"),
      sb.from("plan_limits").select("*"),
      sb.from("add_ons").select("*").eq("is_active", true),
      sb.from("add_on_prices").select("*").eq("is_active", true),
      sb.from("service_offers").select("*").eq("is_active", true).order("sort_order"),
    ]);

    if (plansError) {
      return NextResponse.json({ error: plansError.message }, { status: 500 });
    }

    const catalog = {
      plans: (plans ?? []).map((plan) => ({
        ...plan,
        prices: (prices ?? []).filter((p) => p.plan_id === plan.id),
        features: (features ?? []).filter((f) => f.plan_id === plan.id),
        limits: (limits ?? []).filter((l) => l.plan_id === plan.id),
      })),
      add_ons: (addOns ?? []).map((addon) => ({
        ...addon,
        prices: (addOnPrices ?? []).filter((p) => p.add_on_id === addon.id),
      })),
      service_offers: offers ?? [],
    };

    return NextResponse.json(catalog);
  } catch (e) {
    const message = e instanceof Error ? e.message : "catalog_unavailable";
    return NextResponse.json(
      { error: message, plans: [], add_ons: [], service_offers: [] },
      { status: 503 },
    );
  }
}
