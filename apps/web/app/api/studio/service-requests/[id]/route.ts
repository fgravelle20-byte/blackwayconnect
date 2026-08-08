import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteServiceRequest,
  updateServiceRequest,
} from "@/modules/studio/service-request-service";
import { getOrCreateProfile, isPlatformAdmin, requireUser } from "@/lib/auth/session";

const patchSchema = z.object({
  status: z
    .enum(["new", "reviewing", "quoted", "in_progress", "completed", "cancelled"])
    .optional(),
  description: z.string().min(1).optional(),
  service_type: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
});

async function requireAdmin() {
  await requireUser();
  const profile = await getOrCreateProfile();
  if (!profile || !(await isPlatformAdmin(profile.id))) {
    return null;
  }
  return profile;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const profile = await requireAdmin();
    if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  try {
    const request = await updateServiceRequest(id, parsed.data);
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ request });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const profile = await requireAdmin();
    if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    await deleteServiceRequest(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
