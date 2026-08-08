import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgCanAccessModule, orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { createWebsite, listWebsites } from "@/modules/website-builder/website-service";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  status: z.enum(["draft", "preview", "published", "deployment_required"]).optional(),
  preview_url: z.string().url().optional().nullable().or(z.literal("")),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ websites: [] });
  try {
    const websites = await listWebsites(organization.id);
    return NextResponse.json({ websites });
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

  const allowed = await orgCanAccessModule(
    organization.id,
    "has_website_builder",
    "max_websites",
  );
  if (!allowed) {
    return NextResponse.json({ error: "Website builder not unlocked" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const limit = await orgEffectiveLimit(organization.id, "max_websites");
  if (limit !== -1) {
    const { count } = await sb
      .from("websites")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id);
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "Website limit reached" }, { status: 403 });
    }
  }

  try {
    const website = await createWebsite({
      organization_id: organization.id,
      name: parsed.data.name,
      status: parsed.data.status,
      preview_url: parsed.data.preview_url || null,
    });
    return NextResponse.json({ website });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
