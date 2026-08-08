import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireUser, resolveOrganization } from "@/lib/auth/session";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
  total_cents: z.number().int().min(0).optional(),
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

  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("quotes")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", organization.id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quote: data });
}
