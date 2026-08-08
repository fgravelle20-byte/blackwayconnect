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

const replySchema = z.object({
  ticket_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const profile = await getOrCreateProfile();
  if (!profile) return NextResponse.json({ error: "Profile required" }, { status: 400 });
  const sb = createAdminSupabaseClient();

  const asReply = replySchema.safeParse(json);
  if (asReply.success && !("subject" in (json as object))) {
    const { ticket_id, body } = asReply.data;
    const { data: ticket } = await sb
      .from("support_tickets")
      .select("id, status")
      .eq("id", ticket_id)
      .eq("organization_id", organization.id)
      .maybeSingle();
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { data: message, error } = await sb
      .from("support_messages")
      .insert({
        ticket_id,
        profile_id: profile.id,
        body,
      })
      .select("*")
      .single();
    if (error || !message) {
      return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
    }

    if (ticket.status === "resolved" || ticket.status === "closed") {
      await sb
        .from("support_tickets")
        .update({ status: "open" })
        .eq("id", ticket_id)
        .eq("organization_id", organization.id);
    }

    return NextResponse.json({ message });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

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
