import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/modules/billing/checkout-service";
import { resolveOrganization } from "@/lib/auth/session";

const bodySchema = z
  .object({
    mode: z.enum(["subscription", "payment"]).default("subscription"),
    plan_price_id: z.string().uuid().optional(),
    add_on_price_id: z.string().uuid().optional(),
    service_order_id: z.string().uuid().optional(),
    service_order_payment_id: z.string().uuid().optional(),
    service_payment_type: z
      .enum(["deposit", "milestone", "final", "one_time", "recurring"])
      .optional(),
    locale: z.string().default("en"),
  })
  .superRefine((val, ctx) => {
    const hasPlan = Boolean(val.plan_price_id);
    const hasAddon = Boolean(val.add_on_price_id);
    const hasStudio = Boolean(val.service_order_id || val.service_order_payment_id);

    if (!hasPlan && !hasAddon && !hasStudio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "plan_price_id, add_on_price_id, service_order_id, or service_order_payment_id required",
        path: ["mode"],
      });
      return;
    }

    if (val.mode === "subscription" && !hasPlan && !hasAddon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "plan_price_id or add_on_price_id required for subscription mode",
        path: ["plan_price_id"],
      });
    }

    if (val.mode === "payment" && !hasAddon && !hasStudio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "add_on_price_id, service_order_id, or service_order_payment_id required for payment mode",
        path: ["mode"],
      });
    }

    if (hasStudio && val.mode !== "payment") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "studio payments require payment mode",
        path: ["mode"],
      });
    }
  });

export async function POST(req: Request) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    userId = null;
  }
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await resolveOrganization();
  if (!org?.clerk_org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const email =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;

  const result = await createCheckoutSession({
    ...parsed.data,
    userId,
    clerkOrgId: org.clerk_org_id,
    customerEmail: email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ url: result.url, id: result.id });
}
