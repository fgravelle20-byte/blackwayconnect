import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgCanAccessModule, orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import {
  createReviewCampaign,
  listReviewCampaigns,
} from "@/modules/google-reviews/review-service";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  config: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ campaigns: [] });
  try {
    const campaigns = await listReviewCampaigns(organization.id);
    return NextResponse.json({ campaigns });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const allowed = await orgCanAccessModule(
    organization.id,
    "has_google_reviews",
    "max_review_campaigns",
  );
  if (!allowed) {
    return NextResponse.json({ error: "Google Reviews not unlocked" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const limit = await orgEffectiveLimit(organization.id, "max_review_campaigns");
  if (limit !== -1) {
    const { count } = await sb
      .from("review_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id);
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "Review campaign limit reached" }, { status: 403 });
    }
  }

  try {
    const campaign = await createReviewCampaign({
      organization_id: organization.id,
      name: parsed.data.name,
      config: parsed.data.config,
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
