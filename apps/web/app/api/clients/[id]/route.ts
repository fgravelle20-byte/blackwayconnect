import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { deleteClient, updateClient } from "@/modules/business/business-service";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
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

  const client = await updateClient(id, organization.id, {
    ...parsed.data,
    email: parsed.data.email === "" ? null : parsed.data.email,
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ client });
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
  await deleteClient(id, organization.id);
  return NextResponse.json({ ok: true });
}
