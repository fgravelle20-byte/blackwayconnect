import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { createLead, listLeads } from "@/modules/leads/lead-service";

const createSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  source: z
    .enum([
      "website_form",
      "chatbot",
      "phone_assistance",
      "google_review_campaign",
      "manual",
      "import",
      "quote_request",
      "other",
    ])
    .default("manual"),
  status: z
    .enum(["new", "contacted", "qualified", "won", "lost", "archived"])
    .default("new"),
  score: z.number().int().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ leads: [] });
  try {
    const leads = await listLeads(organization.id);
    return NextResponse.json({ leads });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const limit = await orgEffectiveLimit(organization.id, "max_leads");
  if (limit !== -1) {
    const { count } = await sb
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .neq("status", "archived");
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "Lead limit reached for your plan" }, { status: 403 });
    }
  }

  try {
    const lead = await createLead({
      organization_id: organization.id,
      source: parsed.data.source,
      status: parsed.data.status,
      name: parsed.data.name ?? null,
      email: parsed.data.email || null,
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      score: parsed.data.score,
      metadata: parsed.data.metadata,
    });
    return NextResponse.json({ lead });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
