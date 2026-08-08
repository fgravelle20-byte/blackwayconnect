import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe/client";
import { portalReturnUrl } from "@/lib/stripe/config";
import { resolveOrganization, requireUser } from "@/lib/auth/session";

const bodySchema = z.object({ locale: z.string().default("en") });

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await resolveOrganization();
  if (!organization) {
    return NextResponse.json({ error: "Active organization required" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  const locale = parsed.success ? parsed.data.locale : "en";

  const customerId = organization.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer for organization" }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: portalReturnUrl(locale),
  });

  return NextResponse.json({ url: session.url });
}
