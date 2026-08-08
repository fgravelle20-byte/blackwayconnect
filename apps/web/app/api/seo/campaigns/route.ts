import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgCanAccessModule, orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { createSeoCampaign, listSeoCampaigns } from "@/modules/seo/seo-service";

const createSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ campaigns: [] });
  try {
    const campaigns = await listSeoCampaigns(organization.id);
    return NextResponse.json({ campaigns });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const allowed = await orgCanAccessModule(organization.id, "has_seo", "max_seo_campaigns");
  if (!allowed) {
    return NextResponse.json({ error: "SEO module not unlocked" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const limit = await orgEffectiveLimit(organization.id, "max_seo_campaigns");
  if (limit !== -1) {
    const { count } = await sb
      .from("seo_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id);
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "SEO campaign limit reached" }, { status: 403 });
    }
  }

  try {
    const campaign = await createSeoCampaign({
      organization_id: organization.id,
      name: parsed.data.name,
    });
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
