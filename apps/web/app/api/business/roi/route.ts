import { NextResponse } from "next/server";
import { z } from "zod";
import { orgCanAccessModule } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import {
  computeClientRoiDashboard,
  createManualRevenue,
  createMarketingExpense,
  listMarketingExpenses,
} from "@/modules/business/roi-service";
import { ensureDefaultPipeline } from "@/modules/business/business-service";

const expenseSchema = z.object({
  type: z.literal("expense"),
  client_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  channel: z
    .enum(["ads", "seo", "social", "email", "referral", "events", "content", "other"])
    .optional(),
  spent_on: z.string().date().optional(),
  note: z.string().max(500).optional().nullable(),
  currency: z.string().min(3).max(3).optional(),
});

const revenueSchema = z.object({
  type: z.literal("revenue"),
  client_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  earned_on: z.string().date().optional(),
  note: z.string().max(500).optional().nullable(),
  currency: z.string().min(3).max(3).optional(),
});

const bodySchema = z.discriminatedUnion("type", [expenseSchema, revenueSchema]);

export async function GET(req: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await resolveOrganization();
  if (!organization) {
    return NextResponse.json({
      totals: {
        marketing_spend_cents: 0,
        revenue_cents: 0,
        profit_cents: 0,
        roi_percent: 0,
        clients_count: 0,
        profitable_clients: 0,
      },
      clients: [],
      expenses: [],
    });
  }

  try {
    await ensureDefaultPipeline(organization.id);
    const url = new URL(req.url);
    const clientId = url.searchParams.get("client_id") ?? undefined;
    const [dashboard, expenses] = await Promise.all([
      computeClientRoiDashboard(organization.id),
      listMarketingExpenses(organization.id, clientId),
    ]);
    return NextResponse.json({ ...dashboard, expenses });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "roi_unavailable" },
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
  if (!organization) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const allowed = await orgCanAccessModule(organization.id, "has_business_management");
  if (!allowed) {
    return NextResponse.json({ error: "Business module not unlocked" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.type === "expense") {
      const expense = await createMarketingExpense({
        organization_id: organization.id,
        client_id: parsed.data.client_id,
        amount_cents: parsed.data.amount_cents,
        channel: parsed.data.channel,
        spent_on: parsed.data.spent_on,
        note: parsed.data.note,
        currency: parsed.data.currency,
      });
      const dashboard = await computeClientRoiDashboard(organization.id);
      return NextResponse.json({ expense, dashboard }, { status: 201 });
    }

    const revenue = await createManualRevenue({
      organization_id: organization.id,
      client_id: parsed.data.client_id,
      amount_cents: parsed.data.amount_cents,
      earned_on: parsed.data.earned_on,
      note: parsed.data.note,
      currency: parsed.data.currency,
    });
    const dashboard = await computeClientRoiDashboard(organization.id);
    return NextResponse.json({ revenue, dashboard }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "write_failed" },
      { status: 502 },
    );
  }
}
