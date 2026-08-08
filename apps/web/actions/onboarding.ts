"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getActiveOrganization } from "@/lib/auth/session";

export async function completeOnboardingStep(stepKey: string, data: Record<string, unknown> = {}) {
  const { orgId } = await auth();
  const organization = await getActiveOrganization(orgId);
  if (!organization) throw new Error("Select an organization first");

  const sb = createAdminSupabaseClient();
  await sb.from("onboarding_progress").upsert(
    {
      organization_id: organization.id,
      step_key: stepKey,
      completed_at: new Date().toISOString(),
      data,
    },
    { onConflict: "organization_id,step_key" },
  );

  revalidatePath("/onboarding");
}
