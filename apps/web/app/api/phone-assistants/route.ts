import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgCanAccessModule, orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import {
  createPhoneAssistant,
  listPhoneAssistants,
} from "@/modules/phone-assistance/phone-service";

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
  if (!organization) return NextResponse.json({ assistants: [] });
  try {
    const assistants = await listPhoneAssistants(organization.id);
    return NextResponse.json({ assistants });
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
    "has_phone_assistance",
    "max_phone_assistants",
  );
  if (!allowed) {
    return NextResponse.json({ error: "Phone assistance not unlocked" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const limit = await orgEffectiveLimit(organization.id, "max_phone_assistants");
  if (limit !== -1) {
    const { count } = await sb
      .from("phone_assistants")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id);
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "Phone assistant limit reached" }, { status: 403 });
    }
  }

  try {
    const assistant = await createPhoneAssistant({
      organization_id: organization.id,
      name: parsed.data.name,
      config: parsed.data.config,
    });
    return NextResponse.json({ assistant }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
