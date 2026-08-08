import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import {
  createProduct,
  listProducts,
} from "@/modules/ecommerce/store-service";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  price_cents: z.number().int().min(0).default(0),
  sku: z.string().max(80).optional().nullable(),
  inventory: z.number().int().min(0).optional().nullable(),
});

async function assertStoreOwned(storeId: string, orgId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ products: [] });
  const { id } = await ctx.params;
  if (!(await assertStoreOwned(id, organization.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const products = await listProducts(id);
  return NextResponse.json({ products });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });
  const { id } = await ctx.params;
  if (!(await assertStoreOwned(id, organization.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const limit = await orgEffectiveLimit(organization.id, "max_products");
  if (limit !== -1) {
    const { data: stores } = await sb.from("stores").select("id").eq("organization_id", organization.id);
    const storeIds = (stores ?? []).map((s) => s.id);
    if (storeIds.length) {
      const { count } = await sb
        .from("store_products")
        .select("*", { count: "exact", head: true })
        .in("store_id", storeIds)
        .neq("status", "archived");
      if ((count ?? 0) >= limit) {
        return NextResponse.json({ error: "Product limit reached for your plan" }, { status: 403 });
      }
    }
  }

  const product = await createProduct({ store_id: id, ...parsed.data });
  return NextResponse.json({ product });
}
