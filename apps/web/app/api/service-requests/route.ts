import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail, emailTemplates } from "@/lib/resend/client";

const schema = z.object({
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  company: z.string().optional(),
  service_type: z.string().optional(),
  description: z.string().min(1),
  locale: z.string().default("en"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const sb = createAdminSupabaseClient();
    const { data, error } = await sb
      .from("service_requests")
      .insert({
        contact_name: parsed.data.contact_name,
        contact_email: parsed.data.contact_email,
        company: parsed.data.company ?? null,
        service_type: parsed.data.service_type ?? null,
        description: parsed.data.description,
        locale: parsed.data.locale,
        status: "new",
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const tmpl = emailTemplates.quoteReceived();
    await sendTransactionalEmail({ to: parsed.data.contact_email, ...tmpl }).catch(() => undefined);
    return NextResponse.json({ request: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
