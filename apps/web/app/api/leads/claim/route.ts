import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrganization, requireUser } from "@/lib/auth/session";
import { claimConversionLeads } from "@/modules/onboarding/journey-bootstrap";

const schema = z.object({
  email: z.string().email().optional(),
});

/** Attach orphan conversion chatbot leads to the active organization. */
export async function POST(req: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organization = await resolveOrganization();
  if (!organization) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    const claimed = await claimConversionLeads(organization.id, {
      email: parsed.data.email,
    });
    return NextResponse.json({ claimed: claimed.length, ids: claimed.map((c) => c.id) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
