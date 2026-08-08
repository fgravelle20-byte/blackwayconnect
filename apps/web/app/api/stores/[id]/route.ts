import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { deleteStore, updateStore } from "@/modules/ecommerce/store-service";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
  currency: z.string().length(3).optional(),
  settings: z.record(z.unknown()).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const store = await updateStore(id, organization.id, parsed.data);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ store });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });
  const { id } = await ctx.params;
  await deleteStore(id, organization.id);
  return NextResponse.json({ ok: true });
}
