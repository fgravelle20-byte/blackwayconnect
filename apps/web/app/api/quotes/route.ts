import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { resolveOrganization, requireUser } from "@/lib/auth/session";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  total_cents: z.number().int().min(0).default(0),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ quotes: [] });
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("quotes")
    .select("*")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ quotes: data ?? [] });
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
  const { data, error } = await sb
    .from("quotes")
    .insert({
      organization_id: organization.id,
      title: parsed.data.title,
      total_cents: parsed.data.total_cents,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quote: data });
}
