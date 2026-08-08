import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireUser() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    return userId;
  } catch {
    throw new Error("Unauthorized");
  }
}

export async function getOrCreateProfile() {
  let user;
  try {
    user = await currentUser();
  } catch {
    return null;
  }
  if (!user) return null;
  const sb = createAdminSupabaseClient();
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  const { data: existing } = await sb
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await sb
    .from("profiles")
    .insert({
      clerk_user_id: user.id,
      email,
      full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      avatar_url: user.imageUrl,
    })
    .select("*")
    .single();

  if (error) throw error;
  return created;
}

export type OrganizationRow = {
  id: string;
  clerk_org_id: string | null;
  name: string;
  slug: string;
  logo_url?: string | null;
  owner_profile_id?: string | null;
  stripe_customer_id?: string | null;
  plan_tier?: string;
  white_label_config?: Record<string, unknown> | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

/**
 * Resolve the active Supabase organization for the current session.
 * Prefers Clerk orgId → organizations.clerk_org_id; falls back to the
 * first organization_members row for the signed-in profile.
 */
export async function getActiveOrganization(
  clerkOrgId?: string | null,
  options?: { allowMembershipFallback?: boolean },
): Promise<OrganizationRow | null> {
  const allowFallback = options?.allowMembershipFallback !== false;
  const sb = createAdminSupabaseClient();

  if (clerkOrgId) {
    const { data } = await sb
      .from("organizations")
      .select("*")
      .eq("clerk_org_id", clerkOrgId)
      .maybeSingle();
    const org = data as OrganizationRow | null;
    if (org && !org.deleted_at) return org;
  }

  if (!allowFallback) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return null;

  const { data: membership } = await sb
    .from("organization_members")
    .select("organization_id, organizations(*)")
    .eq("profile_id", profile.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const nested = membership?.organizations;
  if (!nested) return null;
  const resolved = (Array.isArray(nested) ? nested[0] : nested) as OrganizationRow | null;
  if (!resolved || resolved.deleted_at) return null;
  return resolved;
}

/**
 * Session helper for CRUD/billing routes: uses Clerk auth().orgId when present,
 * otherwise the first membership org for the signed-in profile.
 * Returns the full organizations row.
 */
export async function resolveOrganization(): Promise<OrganizationRow | null> {
  const { userId, orgId } = await auth();
  if (!userId) return null;
  return getActiveOrganization(orgId);
}

export async function requireOrganization(): Promise<OrganizationRow> {
  const org = await resolveOrganization();
  if (!org) throw new Error("No organization");
  return org;
}

export async function requireAuthContext() {
  const userId = await requireUser();
  const { orgId } = await auth();
  const profile = await getOrCreateProfile();
  const organization = await resolveOrganization();
  return {
    userId,
    clerkOrgId: orgId ?? organization?.clerk_org_id ?? null,
    profile,
    organization,
  };
}

export async function isPlatformAdmin(profileId: string): Promise<boolean> {
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("platform_admins")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return Boolean(data);
}

/** Ensure the signed-in user has a Clerk Organization; create one if missing. */
export async function ensureClerkOrganization(params: {
  userId: string;
  orgName: string;
  existingClerkOrgId?: string | null;
}) {
  if (params.existingClerkOrgId) return params.existingClerkOrgId;

  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({
    userId: params.userId,
    limit: 1,
  });
  const existing = memberships.data[0]?.organization?.id;
  if (existing) return existing;

  const slugBase = params.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const slug = `${slugBase || "org"}-${params.userId.slice(-6)}`;

  const created = await client.organizations.createOrganization({
    name: params.orgName,
    createdBy: params.userId,
    slug,
  });
  return created.id;
}

/**
 * Server Supabase client authenticated with the Clerk JWT template `supabase`
 * when available (RLS-aware). Falls back to anon key without a user JWT.
 */
export async function createClerkSupabaseClient() {
  const { getToken } = await auth();
  let token: string | null = null;
  try {
    token = await getToken({ template: "supabase" });
  } catch {
    token = null;
  }
  return createServerSupabaseClient(token ?? undefined);
}
