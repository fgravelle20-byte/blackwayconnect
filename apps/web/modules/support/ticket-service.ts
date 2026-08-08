import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function listTickets(orgId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("support_tickets")
    .select("*, support_messages(*)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createTicket(input: {
  organizationId: string;
  profileId: string;
  subject: string;
  body: string;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  const sb = createAdminSupabaseClient();
  const { data: ticket, error } = await sb
    .from("support_tickets")
    .insert({
      organization_id: input.organizationId,
      profile_id: input.profileId,
      subject: input.subject,
      priority: input.priority ?? "normal",
      status: "open",
    })
    .select("*")
    .single();
  if (error || !ticket) throw error ?? new Error("Failed to create ticket");

  await sb.from("support_messages").insert({
    ticket_id: ticket.id,
    profile_id: input.profileId,
    body: input.body,
  });

  return ticket;
}

export async function addTicketMessage(input: {
  organizationId: string;
  profileId: string;
  ticketId: string;
  body: string;
}) {
  const sb = createAdminSupabaseClient();
  const { data: ticket } = await sb
    .from("support_tickets")
    .select("id, status")
    .eq("id", input.ticketId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!ticket) return null;

  const { data: message, error } = await sb
    .from("support_messages")
    .insert({
      ticket_id: input.ticketId,
      profile_id: input.profileId,
      body: input.body,
    })
    .select("*")
    .single();
  if (error || !message) throw error ?? new Error("Failed to add message");

  if (ticket.status === "resolved" || ticket.status === "closed") {
    await sb
      .from("support_tickets")
      .update({ status: "open" })
      .eq("id", input.ticketId)
      .eq("organization_id", input.organizationId);
  }

  return message;
}
