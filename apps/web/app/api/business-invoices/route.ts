import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireUser, resolveOrganization } from "@/lib/auth/session";

const createSchema = z.object({
  total_cents: z.number().int().min(0).default(0),
  quote_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        amount_cents: z.number().int().min(0),
      }),
    )
    .max(50)
    .optional(),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ invoices: [] });
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("business_invoices")
    .select("*, business_invoice_items(*)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ invoices: data ?? [] });
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

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sb = createAdminSupabaseClient();
  const { data: invoice, error } = await sb
    .from("business_invoices")
    .insert({
      organization_id: organization.id,
      quote_id: parsed.data.quote_id ?? null,
      client_id: parsed.data.client_id ?? null,
      total_cents: parsed.data.total_cents,
      status: "draft",
    })
    .select("*")
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: error?.message ?? "create_failed" }, { status: 500 });
  }

  if (parsed.data.items?.length) {
    await sb.from("business_invoice_items").insert(
      parsed.data.items.map((item) => ({
        business_invoice_id: invoice.id,
        description: item.description,
        amount_cents: item.amount_cents,
      })),
    );
  }

  return NextResponse.json({ invoice }, { status: 201 });
}
