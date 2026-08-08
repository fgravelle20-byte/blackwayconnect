import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgCanAccessModule, orgEffectiveLimit } from "@/lib/permissions";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { createChatbot, listChatbots } from "@/modules/chatbot/chatbot-service";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  widget_config: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ chatbots: [] });
  try {
    const chatbots = await listChatbots(organization.id);
    return NextResponse.json({ chatbots });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unavailable" },
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
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const allowed = await orgCanAccessModule(organization.id, "has_chatbots", "max_chatbots");
  if (!allowed) {
    return NextResponse.json({ error: "Chatbots module not unlocked" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  const limit = await orgEffectiveLimit(organization.id, "max_chatbots");
  if (limit !== -1) {
    const { count } = await sb
      .from("chatbots")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id);
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "Chatbot limit reached" }, { status: 403 });
    }
  }

  try {
    const chatbot = await createChatbot({
      organization_id: organization.id,
      name: parsed.data.name,
      widget_config: parsed.data.widget_config,
    });
    return NextResponse.json({ chatbot });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
