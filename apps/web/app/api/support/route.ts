import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getOrCreateProfile,
  requireUser,
  resolveOrganization,
} from "@/lib/auth/session";

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ tickets: [] });
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("support_tickets")
    .select("*, support_messages(*)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ tickets: data ?? [] });
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
  const profile = await getOrCreateProfile();
  if (!profile) return NextResponse.json({ error: "Profile required" }, { status: 400 });
  const sb = createAdminSupabaseClient();

  const { data: ticket, error } = await sb
    .from("support_tickets")
    .insert({
      organization_id: organization.id,
      profile_id: profile.id,
      subject: parsed.data.subject,
      priority: parsed.data.priority,
      status: "open",
    })
    .select("*")
    .single();
  if (error || !ticket) return NextResponse.json({ error: error?.message }, { status: 500 });

  await sb.from("support_messages").insert({
    ticket_id: ticket.id,
    profile_id: profile.id,
    body: parsed.data.body,
  });

  return NextResponse.json({ ticket });
}
