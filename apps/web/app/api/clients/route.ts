import { NextResponse } from "next/server";
import { z } from "zod";
import { orgCanAccessModule } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import {
  createClient,
  createDeal,
  listClients,
  listDeals,
  ensureDefaultPipeline,
} from "@/modules/business/business-service";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable().or(z.literal("")),
});

const dealSchema = z.object({
  title: z.string().min(1).max(200),
  value_cents: z.number().int().min(0).optional(),
  client_id: z.string().uuid().optional().nullable(),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ clients: [], deals: [] });
  try {
    await ensureDefaultPipeline(organization.id);
    const [clients, deals] = await Promise.all([
      listClients(organization.id),
      listDeals(organization.id),
    ]);
    return NextResponse.json({ clients, deals });
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

  const allowed = await orgCanAccessModule(organization.id, "has_business_management");
  if (!allowed) {
    return NextResponse.json({ error: "Business module not unlocked" }, { status: 403 });
  }

  const body = await req.json();
  if (body?.type === "deal") {
    const parsed = dealSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    const deal = await createDeal({
      organization_id: organization.id,
      title: parsed.data.title,
      value_cents: parsed.data.value_cents,
      client_id: parsed.data.client_id,
    });
    return NextResponse.json({ deal }, { status: 201 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const client = await createClient({
    organization_id: organization.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
  });
  return NextResponse.json({ client }, { status: 201 });
}
