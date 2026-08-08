import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail, emailTemplates } from "@/lib/resend/client";
import { captureServerEvent } from "@/lib/posthog/server";

type ClerkEmail = { email_address: string };
type ClerkUser = {
  id: string;
  email_addresses: ClerkEmail[];
  first_name: string | null;
  last_name: string | null;
  image_url: string;
};
type ClerkOrg = { id: string; name: string; slug: string | null; created_by?: string };
type ClerkMembership = {
  id: string;
  role: string;
  organization: { id: string };
  public_user_data: { user_id: string };
};

function mapClerkOrgRole(role: string): "owner" | "admin" | "member" | "client" {
  const normalized = role.toLowerCase();
  if (normalized === "org:owner" || normalized === "owner") return "owner";
  if (normalized === "org:admin" || normalized === "admin") return "admin";
  if (normalized === "org:client" || normalized === "client") return "client";
  return "member";
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  const payload = await req.text();
  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const wh = new Webhook(secret);
  let evt: { type: string; data: unknown };
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sb = createAdminSupabaseClient();

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const user = evt.data as ClerkUser;
        const email = user.email_addresses[0]?.email_address ?? "";
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || null;
        await sb.from("profiles").upsert(
          {
            clerk_user_id: user.id,
            email,
            full_name: fullName,
            avatar_url: user.image_url,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "clerk_user_id" },
        );
        if (evt.type === "user.created" && email) {
          const tmpl = emailTemplates.welcome(fullName || "");
          await sendTransactionalEmail({ to: email, ...tmpl }).catch(() => undefined);
          await captureServerEvent(user.id, "user_signed_up", { email_domain: email.split("@")[1] });
        }
        break;
      }
      case "user.deleted": {
        const user = evt.data as { id: string };
        // Soft-delete: retain audit/billing history
        await sb
          .from("profiles")
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_user_id", user.id);
        break;
      }
      case "organization.created":
      case "organization.updated": {
        const org = evt.data as ClerkOrg;
        let ownerProfileId: string | null = null;
        if (org.created_by) {
          const { data: profile } = await sb
            .from("profiles")
            .select("id")
            .eq("clerk_user_id", org.created_by)
            .maybeSingle();
          ownerProfileId = profile?.id ?? null;
        }
        const slug =
          org.slug ||
          org.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") +
            "-" +
            org.id.slice(-6);
        await sb.from("organizations").upsert(
          {
            clerk_org_id: org.id,
            name: org.name,
            slug,
            owner_profile_id: ownerProfileId,
            deleted_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "clerk_org_id" },
        );
        if (evt.type === "organization.created" && ownerProfileId) {
          const { data: orgRow } = await sb
            .from("organizations")
            .select("id")
            .eq("clerk_org_id", org.id)
            .maybeSingle();
          if (orgRow) {
            await sb.from("organization_members").upsert(
              {
                organization_id: orgRow.id,
                profile_id: ownerProfileId,
                role: "owner",
              },
              { onConflict: "organization_id,profile_id" },
            );
          }
        }
        break;
      }
      case "organization.deleted": {
        const org = evt.data as { id: string };
        // Soft-delete: keep billing history, clear active Clerk link
        await sb
          .from("organizations")
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_org_id", org.id);
        break;
      }
      case "organizationMembership.created":
      case "organizationMembership.updated": {
        const m = evt.data as ClerkMembership;
        const [{ data: profile }, { data: org }] = await Promise.all([
          sb.from("profiles").select("id").eq("clerk_user_id", m.public_user_data.user_id).maybeSingle(),
          sb.from("organizations").select("id").eq("clerk_org_id", m.organization.id).maybeSingle(),
        ]);
        if (profile && org) {
          const role = mapClerkOrgRole(m.role);
          await sb.from("organization_members").upsert(
            {
              organization_id: org.id,
              profile_id: profile.id,
              clerk_org_member_id: m.id,
              role,
            },
            { onConflict: "organization_id,profile_id" },
          );
        }
        break;
      }
      case "organizationMembership.deleted": {
        const m = evt.data as ClerkMembership;
        await sb.from("organization_members").delete().eq("clerk_org_member_id", m.id);
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    Sentry.captureException(e, { tags: { webhook: "clerk" } });
    const message = e instanceof Error ? e.message : "clerk_webhook_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
