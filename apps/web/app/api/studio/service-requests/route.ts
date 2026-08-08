import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createServiceRequest,
  listServiceRequests,
} from "@/modules/studio/service-request-service";
import {
  emailTemplates,
  sendTransactionalEmail,
} from "@/lib/resend/client";
import { getOrCreateProfile, isPlatformAdmin, requireUser } from "@/lib/auth/session";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  offer_slug: z.string().optional(),
  description: z.string().min(1),
});

export async function GET() {
  try {
    await requireUser();
    const profile = await getOrCreateProfile();
    if (!profile || !(await isPlatformAdmin(profile.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await listServiceRequests();
    return NextResponse.json({ requests });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const data = await createServiceRequest({
      contact_name: parsed.data.name,
      contact_email: parsed.data.email,
      company: parsed.data.company,
      service_type: parsed.data.offer_slug ?? "custom",
      description: parsed.data.description,
    });

    try {
      const t = emailTemplates.quoteReceived();
      await sendTransactionalEmail({ to: parsed.data.email, ...t });
    } catch (e) {
      console.error("email failed", e);
    }

    return NextResponse.json({ id: data.id, request: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
