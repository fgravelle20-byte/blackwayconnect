import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRequest } from "@/modules/studio/service-request-service";
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
    const data = await createServiceRequest({
      contact_name: parsed.data.contact_name,
      contact_email: parsed.data.contact_email,
      company: parsed.data.company,
      service_type: parsed.data.service_type,
      description: parsed.data.description,
      locale: parsed.data.locale,
    });
    const tmpl = emailTemplates.quoteReceived();
    await sendTransactionalEmail({ to: parsed.data.contact_email, ...tmpl }).catch(() => undefined);
    return NextResponse.json({ request: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
