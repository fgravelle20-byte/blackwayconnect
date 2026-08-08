import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { deleteLead, updateLead } from "@/modules/leads/lead-service";

const patchSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  status: z.enum(["new", "contacted", "qualified", "won", "lost", "archived"]).optional(),
  score: z.number().int().min(0).max(100).optional(),
  source: z
    .enum([
      "website_form",
      "chatbot",
      "phone_assistance",
      "google_review_campaign",
      "manual",
      "import",
      "quote_request",
      "other",
    ])
    .optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const lead = await updateLead(id, organization.id, {
    ...parsed.data,
    email: parsed.data.email === "" ? null : parsed.data.email,
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });
  const { id } = await ctx.params;
  await deleteLead(id, organization.id);
  return NextResponse.json({ ok: true });
}
