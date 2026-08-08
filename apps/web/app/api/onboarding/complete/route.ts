import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  ensureClerkOrganization,
  getActiveOrganization,
  getOrCreateProfile,
  requireUser,
  type OrganizationRow,
} from "@/lib/auth/session";
import {
  emailTemplates,
  sendTransactionalEmail,
} from "@/lib/resend/client";
import { captureServerEvent } from "@/lib/posthog/server";
import { auth } from "@clerk/nextjs/server";

const schema = z.object({
  orgName: z.string().min(1),
  industry: z.string().optional(),
  goals: z.string().optional(),
});

/** Completes onboarding progress for an existing or newly created Clerk org. */
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
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const profile = await getOrCreateProfile();
  if (!profile) {
    return NextResponse.json({ error: "Profile required" }, { status: 400 });
  }

  const clerkOrgId = await ensureClerkOrganization({
    userId,
    orgName: parsed.data.orgName,
    existingClerkOrgId: sessionOrgId,
  });

  const sb = createAdminSupabaseClient();
  let orgRecord = await getActiveOrganization(clerkOrgId, {
    allowMembershipFallback: false,
  });

  if (!orgRecord) {
    const slug =
      parsed.data.orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      userId.slice(-6);
    const { data: created, error } = await sb
      .from("organizations")
      .upsert(
        {
          name: parsed.data.orgName,
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
    orgRecord = created as OrganizationRow;
  } else {
    await sb
      .from("organizations")
      .update({ name: parsed.data.orgName, clerk_org_id: clerkOrgId })
      .eq("id", orgRecord.id);
  }

  await sb.from("organization_members").upsert(
    { organization_id: orgRecord.id, profile_id: profile.id, role: "owner" },
    { onConflict: "organization_id,profile_id" },
  );

  const steps = [
    { key: "org_name", data: { name: parsed.data.orgName } },
    { key: "industry", data: { industry: parsed.data.industry } },
    { key: "goals", data: { goals: parsed.data.goals } },
    { key: "completed", data: { at: new Date().toISOString() } },
  ];
  for (const s of steps) {
    await sb.from("onboarding_progress").upsert(
      {
        organization_id: orgRecord.id,
        step_key: s.key,
        completed_at: new Date().toISOString(),
        data: s.data,
      },
      { onConflict: "organization_id,step_key" },
    );
    await captureServerEvent(userId, "onboarding_step_completed", {
      step_key: s.key,
      organization_id: orgRecord.id,
    });
  }

  await captureServerEvent(userId, "onboarding_completed", {
    organization_id: orgRecord.id,
    clerk_org_id: clerkOrgId,
  });

  if (profile.email) {
    try {
      const t = emailTemplates.onboarding();
      await sendTransactionalEmail({ to: profile.email, ...t });
    } catch (e) {
      console.error(e);
    }
  }

  return NextResponse.json({
    ok: true,
    organizationId: orgRecord.id,
    clerkOrgId,
  });
}
