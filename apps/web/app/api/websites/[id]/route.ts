import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { deleteWebsite, updateWebsite } from "@/modules/website-builder/website-service";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["draft", "preview", "published", "deployment_required"]).optional(),
  preview_url: z.string().url().optional().nullable().or(z.literal("")),
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

  const website = await updateWebsite(id, organization.id, {
    ...parsed.data,
    preview_url: parsed.data.preview_url === "" ? null : parsed.data.preview_url,
  });
  if (!website) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ website });
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
  await deleteWebsite(id, organization.id);
  return NextResponse.json({ ok: true });
}
