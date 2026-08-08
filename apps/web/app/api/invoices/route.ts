import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getActiveOrganization, requireUser } from "@/lib/auth/session";
import { auth } from "@clerk/nextjs/server";

const createSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  total_cents: z.number().int().min(0).default(0),
  quote_id: z.string().uuid().optional(),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { orgId } = await auth();
  const organization = await getActiveOrganization(orgId);
  if (!organization) return NextResponse.json({ invoices: [] });
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("business_invoices")
    .select("*")
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
  const { orgId } = await auth();
  const organization = await getActiveOrganization(orgId);
  if (!organization) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("business_invoices")
    .insert({
      organization_id: organization.id,
      status: "draft",
      total_cents: parsed.data.total_cents,
      quote_id: parsed.data.quote_id ?? null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.title) {
    await sb.from("business_invoice_items").insert({
      business_invoice_id: data.id,
      description: parsed.data.title,
      amount_cents: parsed.data.total_cents,
    });
  }

  return NextResponse.json({ invoice: data });
}
