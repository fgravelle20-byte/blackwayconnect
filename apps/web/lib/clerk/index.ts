/**
 * Clerk identity helpers — thin facade over session + Clerk SDK.
 * Plan layout: `lib/clerk/` (auth source of truth remains `@clerk/nextjs/server`).
 */
export {
  requireUser,
  getOrCreateProfile,
  getActiveOrganization,
  resolveOrganization,
  requireOrganization,
  requireAuthContext,
  isPlatformAdmin,
  ensureClerkOrganization,
  createClerkSupabaseClient,
  type OrganizationRow,
} from "@/lib/auth/session";

export { requirePlatformAdmin, requireOrgMembership } from "@/lib/clerk/guards";
