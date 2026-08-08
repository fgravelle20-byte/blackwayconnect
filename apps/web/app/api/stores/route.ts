import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { createStore, listStores } from "@/modules/ecommerce/store-service";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  currency: z.string().length(3).optional(),
  project_id: z.string().uuid().optional().nullable(),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ stores: [] });
  try {
    const stores = await listStores(organization.id);
    return NextResponse.json({ stores });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const limit = await orgEffectiveLimit(organization.id, "max_stores");
  if (limit !== -1) {
    const { count } = await sb
      .from("stores")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .neq("status", "archived");
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "Store limit reached for your plan" }, { status: 403 });
    }
  }

  try {
    const store = await createStore({
      organization_id: organization.id,
      name: parsed.data.name,
      currency: parsed.data.currency,
      project_id: parsed.data.project_id,
    });
    return NextResponse.json({ store });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
