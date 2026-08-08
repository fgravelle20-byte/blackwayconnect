import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { deleteProduct, updateProduct } from "@/modules/ecommerce/store-service";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  price_cents: z.number().int().min(0).optional(),
  sku: z.string().max(80).optional().nullable(),
  inventory: z.number().int().min(0).optional().nullable(),
  status: z.enum(["draft", "active", "archived", "out_of_stock"]).optional(),
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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; productId: string }> },
) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });
  const { id, productId } = await ctx.params;
  if (!(await assertStoreOwned(id, organization.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const product = await updateProduct(productId, id, parsed.data);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; productId: string }> },
) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });
  const { id, productId } = await ctx.params;
  if (!(await assertStoreOwned(id, organization.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await deleteProduct(productId, id);
  return NextResponse.json({ ok: true });
}
