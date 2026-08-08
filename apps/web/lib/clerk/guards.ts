import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getOrCreateProfile,
  isPlatformAdmin,
  resolveOrganization,
  type OrganizationRow,
} from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { OrgRole } from "@noirroutes/database";

const ROLE_RANK: Record<OrgRole, number> = {
  client: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/**
 * Double-check platform admin: `platform_admins` table OR Clerk publicMetadata.role.
 * Matches Phase 1 ADR — never trust UI alone for /admin.
 */
export async function requirePlatformAdmin() {
  const profile = await getOrCreateProfile();
  if (!profile) {
    throw new Error("Unauthorized");
  }

  if (await isPlatformAdmin(profile.id)) {
    return profile;
  }

  let user;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  const metaRole = (user?.publicMetadata as { role?: string } | undefined)?.role;
  if (metaRole === "platform_admin") {
    // Bootstrap: sync Clerk metadata into platform_admins when missing
    const sb = createAdminSupabaseClient();
    await sb.from("platform_admins").upsert(
      { profile_id: profile.id },
      { onConflict: "profile_id" },
    );
    return profile;
  }

  throw new Error("Forbidden");
}

/**
 * Ensure the signed-in user is a member of the active org with at least `minRole`.
 */
export async function requireOrgMembership(
  minRole: OrgRole = "member",
): Promise<{ organization: OrganizationRow; role: OrgRole; profileId: string }> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const profile = await getOrCreateProfile();
  if (!profile) throw new Error("Unauthorized");

  const organization = await resolveOrganization();
  if (!organization) throw new Error("No organization");

  // Prefer Clerk active org when present
  if (orgId && organization.clerk_org_id && organization.clerk_org_id !== orgId) {
    throw new Error("Organization mismatch");
  }

  const sb = createAdminSupabaseClient();
  const { data: membership } = await sb
    .from("organization_members")
    .select("role")
    .eq("organization_id", organization.id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!membership?.role) throw new Error("Forbidden");

  const role = membership.role as OrgRole;
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new Error("Forbidden");
  }

  return { organization, role, profileId: profile.id };
}
