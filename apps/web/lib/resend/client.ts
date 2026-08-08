import { Resend } from "resend";
import { env } from "@/lib/env";

let resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

export const fromEmail = env.RESEND_FROM_EMAIL;

const brand = env.NEXT_PUBLIC_APP_NAME || "NoirRoutes";

function wrap(title: string, body: string) {
  const styles = `body{font-family:system-ui,sans-serif;background:#0A0A0A;color:#FAFAFA;margin:0;padding:24px}.card{background:#1A1A1A;border-radius:8px;padding:24px;max-width:560px;margin:0 auto}.accent{color:#DC2626}`;
  return `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="card"><h1 class="accent">${brand}</h1><h2>${title}</h2>${body}<p style="margin-top:24px;color:#a3a3a3;font-size:12px;">© ${new Date().getFullYear()} ${brand} · noirroutes.com</p></div></body></html>`;
}

export const emailTemplates = {
  welcome(name?: string | null) {
    return {
      subject: `Welcome to ${brand}`,
      html: wrap("Welcome aboard", `<p>Hi ${name || "there"},</p><p>Your ${brand} account is ready.</p>`),
    };
  },
  paymentConfirmed(amount = "") {
    return {
      subject: `${brand} — Payment confirmed`,
      html: wrap("Payment confirmed", `<p>We received your payment${amount ? ` of <strong>${amount}</strong>` : ""}. Thank you for choosing ${brand}.</p>`),
    };
  },
  paymentFailed() {
    return {
      subject: `${brand} — Payment failed`,
      html: wrap("Payment failed", `<p>Your recent payment could not be processed. Update billing in the ${brand} dashboard.</p>`),
    };
  },
  subscriptionCanceled() {
    return {
      subject: `${brand} — Subscription canceled`,
      html: wrap("Subscription canceled", `<p>Your ${brand} subscription has been canceled.</p>`),
    };
  },
  quoteReceived() {
    return {
      subject: `${brand} — Quote request received`,
      html: wrap("Quote received", `<p>We received your quote request and will respond shortly.</p>`),
    };
  },
  onboardingReminder(step: string) {
    return {
      subject: `${brand} — Complete your setup`,
      html: wrap("Finish onboarding", `<p>Complete the <strong>${step}</strong> step to get started with ${brand}.</p>`),
    };
  },
  onboarding(name?: string | null) {
    return {
      subject: `Welcome to ${brand} — complete onboarding`,
      html: wrap("Onboarding", `<p>Hi ${name || "there"},</p><p>Complete onboarding to unlock your ${brand} workspace.</p>`),
    };
  },
  trialEnding(daysLeft = 3) {
    return {
      subject: `${brand} — Your trial ends soon`,
      html: wrap(
        "Trial ending",
        `<p>Your trial ends in approximately <strong>${daysLeft}</strong> day(s). Add a payment method in Billing to keep access.</p>`,
      ),
    };
  },
};

export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn("Resend not configured — skipping email to", to);
    return;
  }
  await client.emails.send({ from: fromEmail, to, subject, html });
}