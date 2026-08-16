import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live engine telemetry — proves the motor, not marketing. */
export async function GET() {
  const integrations = {
    clerk: Boolean(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
        process.env.CLERK_SECRET_KEY &&
        !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder"),
    ),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    posthog: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  };

  if (!integrations.supabase) {
    return NextResponse.json(
      {
        ok: false,
        motor: "OFFLINE",
        reason: "SUPABASE_NOT_CONFIGURED",
        integrations,
      },
      { status: 503 },
    );
  }

  try {
    const sb = createAdminSupabaseClient();
    const [
      plans,
      addons,
      modules,
      leads,
      projects,
      stores,
      chatSessions,
      websites,
      phone,
      reviews,
      chatbots,
      clients,
      orphanLeads,
    ] = await Promise.all([
      sb.from("plans").select("*", { count: "exact", head: true }).eq("is_active", true),
      sb.from("add_ons").select("*", { count: "exact", head: true }).eq("is_active", true),
      sb.from("add_ons").select("id", { count: "exact", head: true }).or("slug.like.module_%,slug.like.pack_%"),
      sb.from("leads").select("*", { count: "exact", head: true }),
      sb.from("projects").select("*", { count: "exact", head: true }),
      sb.from("stores").select("*", { count: "exact", head: true }),
      sb.from("conversion_chat_sessions").select("*", { count: "exact", head: true }),
      sb.from("websites").select("*", { count: "exact", head: true }),
      sb.from("phone_assistants").select("*", { count: "exact", head: true }),
      sb.from("review_campaigns").select("*", { count: "exact", head: true }),
      sb.from("chatbots").select("*", { count: "exact", head: true }),
      sb.from("clients").select("*", { count: "exact", head: true }),
      sb.from("leads").select("*", { count: "exact", head: true }).is("organization_id", null),
    ]);

    const { data: planRows } = await sb
      .from("plans")
      .select("tier, name, slug, is_public")
      .eq("is_active", true)
      .order("sort_order");
    const { data: moduleRows } = await sb
      .from("add_ons")
      .select("slug, name, category, unlocks_feature")
      .or("slug.like.module_%,slug.like.pack_%")
      .eq("is_active", true)
      .order("sort_order");

    return NextResponse.json({
      ok: true,
      motor: "ONLINE",
      service: "VORIXA",
      platform: "MASTER",
      appEnv: process.env.APP_ENV ?? "DEV",
      integrations,
      journey: [
        "1. Visitor → /api/chat/conversion (lead)",
        "2. Sign-up / Clerk org",
        "3. Onboarding → bootstrap (claim leads, pipeline, starter site)",
        "4. Billing → plan or module unlocks features",
        "5. Dashboard modules CRUD (websites, seo, chatbots, phone, reviews, ecommerce, leads, business)",
        "6. Studio quotes / support / invoices",
      ],
      counts: {
        plans: plans.count ?? 0,
        addons: addons.count ?? 0,
        modules: modules.count ?? 0,
        leads: leads.count ?? 0,
        orphan_conversion_leads: orphanLeads.count ?? 0,
        projects: projects.count ?? 0,
        stores: stores.count ?? 0,
        conversion_chat_sessions: chatSessions.count ?? 0,
        websites: websites.count ?? 0,
        chatbots: chatbots.count ?? 0,
        phone_assistants: phone.count ?? 0,
        review_campaigns: reviews.count ?? 0,
        clients: clients.count ?? 0,
      },
      plans: planRows ?? [],
      modules: moduleRows ?? [],
      apis: [
        "/api/commerce/catalog",
        "/api/chat/conversion",
        "/api/onboarding",
        "/api/leads",
        "/api/leads/claim",
        "/api/projects",
        "/api/stores",
        "/api/websites",
        "/api/seo/campaigns",
        "/api/chatbots",
        "/api/phone-assistants",
        "/api/review-campaigns",
        "/api/clients",
        "/api/business/roi",
        "/api/stripe/checkout",
        "/api/stripe/session-status",
        "/api/webhooks/clerk",
        "/api/webhooks/stripe",
        "/api/engine/status",
      ],
      time: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        motor: "ERROR",
        error: e instanceof Error ? e.message : "engine_error",
        integrations,
      },
      { status: 500 },
    );
  }
}
