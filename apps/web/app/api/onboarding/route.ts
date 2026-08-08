import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  ensureClerkOrganization,
  getOrCreateProfile,
  getActiveOrganization,
  requireUser,
  type OrganizationRow,
} from "@/lib/auth/session";
import { sendTransactionalEmail, emailTemplates } from "@/lib/resend/client";
import { captureServerEvent } from "@/lib/posthog/server";
import { auth } from "@clerk/nextjs/server";

const schema = z.object({
  org_name: z.string().min(1).max(120),
  industry: z.string().min(1).max(120),
  goals: z.string().min(1).max(2000),
  step_key: z.string().optional(),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminSupabaseClient();
  const { data: templates } = await sb
    .from("onboarding_templates")
    .select("step_key, sort_order, plan_tier")
    .eq("plan_tier", "starter")
    .order("sort_order", { ascending: true });

  return NextResponse.json({ templates: templates ?? [] });
}

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId: sessionOrgId } = await auth();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const profile = await getOrCreateProfile();
  if (!profile) {
    return NextResponse.json({ error: "Profile required" }, { status: 400 });
  }

  const clerkOrgId = await ensureClerkOrganization({
    userId,
    orgName: parsed.data.org_name,
    existingClerkOrgId: sessionOrgId,
  });

  const sb = createAdminSupabaseClient();
  let organization = await getActiveOrganization(clerkOrgId, {
    allowMembershipFallback: false,
  });

  if (organization) {
    await sb
      .from("organizations")
      .update({
        name: parsed.data.org_name,
        clerk_org_id: clerkOrgId,
        owner_profile_id: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organization.id);
  } else {
    const slug =
      parsed.data.org_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      userId.slice(-6);
    const { data: created, error } = await sb
      .from("organizations")
      .upsert(
        {
          name: parsed.data.org_name,
          slug,
          clerk_org_id: clerkOrgId,
          owner_profile_id: profile.id,
        },
        { onConflict: "clerk_org_id" },
      )
      .select("*")
      .single();
    if (error || !created) {
      return NextResponse.json({ error: error?.message }, { status: 500 });
    }
    organization = created as OrganizationRow;
  }

  if (!organization) {
    return NextResponse.json({ error: "Failed to resolve organization" }, { status: 500 });
  }

  const orgRecord = organization;

  await sb.from("organization_members").upsert(
    { organization_id: orgRecord.id, profile_id: profile.id, role: "owner" },
    { onConflict: "organization_id,profile_id" },
  );

  const steps = [
    { step_key: "org_name", data: { value: parsed.data.org_name } },
    { step_key: "industry", data: { value: parsed.data.industry } },
    { step_key: "goals", data: { value: parsed.data.goals } },
    { step_key: "organization", data: { value: parsed.data.org_name } },
    { step_key: "completed", data: { at: new Date().toISOString() } },
  ];

  for (const step of steps) {
    await sb.from("onboarding_progress").upsert(
      {
        organization_id: orgRecord.id,
        step_key: step.step_key,
        data: step.data,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,step_key" },
    );
    await captureServerEvent(userId, "onboarding_step_completed", {
      step_key: step.step_key,
      organization_id: orgRecord.id,
    });
  }

  await captureServerEvent(userId, "onboarding_completed", {
    organization_id: orgRecord.id,
    clerk_org_id: clerkOrgId,
  });

  if (profile.email) {
    const tmpl = emailTemplates.onboarding();
    await sendTransactionalEmail({ to: profile.email, ...tmpl }).catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    organization_id: orgRecord.id,
    clerk_org_id: clerkOrgId,
  });
}
