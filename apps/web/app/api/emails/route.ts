import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { emailTemplates, sendTransactionalEmail } from "@/lib/resend/client";
import { requirePlatformAdmin } from "@/lib/clerk/guards";

export const runtime = "nodejs";

const bodySchema = z.object({
  to: z.string().email(),
  template: z.enum([
    "welcome",
    "paymentConfirmed",
    "paymentFailed",
    "subscriptionCanceled",
    "quoteReceived",
    "onboardingReminder",
    "onboarding",
    "trialEnding",
  ]),
  locale: z.enum(["en", "fr"]).optional(),
  name: z.string().optional(),
  amount: z.string().optional(),
  step: z.string().optional(),
  daysLeft: z.number().int().positive().optional(),
});

/**
 * Internal email trigger — platform admins only.
 * Used for QA of Resend templates (Phase 1 DoD #10).
 */
export async function POST(req: Request) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { to, template, locale, name, amount, step, daysLeft } = parsed.data;
  let payload: { subject: string; html: string };

  switch (template) {
    case "welcome":
      payload = emailTemplates.welcome(name, locale);
      break;
    case "paymentConfirmed":
      payload = emailTemplates.paymentConfirmed(amount ?? "", locale);
      break;
    case "paymentFailed":
      payload = emailTemplates.paymentFailed(locale);
      break;
    case "subscriptionCanceled":
      payload = emailTemplates.subscriptionCanceled(locale);
      break;
    case "quoteReceived":
      payload = emailTemplates.quoteReceived(locale);
      break;
    case "onboardingReminder":
      payload = emailTemplates.onboardingReminder(step ?? "organization", locale);
      break;
    case "onboarding":
      payload = emailTemplates.onboarding(name, locale);
      break;
    case "trialEnding":
      payload = emailTemplates.trialEnding(daysLeft ?? 3, locale);
      break;
  }

  const result = await sendTransactionalEmail({ to, ...payload });
  return NextResponse.json({ ok: true, template, locale: locale ?? "en", ...result });
}
