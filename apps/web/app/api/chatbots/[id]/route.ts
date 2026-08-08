import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { deleteChatbot, updateChatbot } from "@/modules/chatbot/chatbot-service";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  widget_config: z.record(z.unknown()).optional(),
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

  const chatbot = await updateChatbot(id, organization.id, parsed.data);
  if (!chatbot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ chatbot });
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
  await deleteChatbot(id, organization.id);
  return NextResponse.json({ ok: true });
}
