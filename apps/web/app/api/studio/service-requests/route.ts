import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  emailTemplates,
  sendTransactionalEmail,
} from "@/lib/resend/client";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  offer_slug: z.string().optional(),
  description: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("service_requests")
    .insert({
      contact_name: parsed.data.name,
      contact_email: parsed.data.email,
      company: parsed.data.company ?? null,
      service_type: parsed.data.offer_slug ?? "custom",
      description: parsed.data.description,
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const t = emailTemplates.quoteReceived();
    await sendTransactionalEmail({ to: parsed.data.email, ...t });
  } catch (e) {
    console.error("email failed", e);
  }

  return NextResponse.json({ id: data.id });
}
