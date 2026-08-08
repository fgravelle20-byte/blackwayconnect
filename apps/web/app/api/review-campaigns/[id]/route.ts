import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import {
  createReviewRequestWithSuggestion,
  deleteReviewCampaign,
  updateReviewCampaign,
} from "@/modules/google-reviews/review-service";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z
    .enum(["planned", "active", "paused", "completed", "integration_required"])
    .optional(),
  config: z.record(z.unknown()).optional(),
});

const requestSchema = z.object({
  customer_contact: z.string().min(3).max(200),
  customer_name: z.string().max(120).optional().nullable(),
  suggestion: z.string().min(10).max(2000).optional(),
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

  const campaign = await updateReviewCampaign(id, organization.id, parsed.data);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ campaign });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });
  const { id } = await ctx.params;
  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const name = parsed.data.customer_name || "Customer";
  const suggestion =
    parsed.data.suggestion ||
    `Had a great experience with ${name}. Professional, fast, and genuinely helpful. Highly recommend!`;

  try {
    const request = await createReviewRequestWithSuggestion({
      campaign_id: id,
      organization_id: organization.id,
      customer_contact: parsed.data.customer_contact,
      customer_name: parsed.data.customer_name,
      suggestion,
    });
    return NextResponse.json({ request, policy: "suggestion_only_never_auto_posted" }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
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
  await deleteReviewCampaign(id, organization.id);
  return NextResponse.json({ ok: true });
}
