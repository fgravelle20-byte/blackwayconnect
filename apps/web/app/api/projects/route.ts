import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["website", "web_app", "ios_app", "android_app", "hybrid"]).default("website"),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ projects: [] });
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("projects")
    .select("*")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ projects: data ?? [] });
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
  const limit = await orgEffectiveLimit(organization.id, "max_projects");
  if (limit !== -1) {
    const { count } = await sb
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .neq("status", "archived");
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "Project limit reached for your plan" }, { status: 403 });
    }
  }

  const { data, error } = await sb
    .from("projects")
    .insert({
      organization_id: organization.id,
      name: parsed.data.name,
      type: parsed.data.type,
      status: "active",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}
