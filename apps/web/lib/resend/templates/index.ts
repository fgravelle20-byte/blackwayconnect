import { getResend, fromEmail } from "@/lib/resend/client";

const brand = process.env.NEXT_PUBLIC_APP_NAME || "NoirRoutes";
const styles = `
  body { font-family: system-ui, sans-serif; background: #0A0A0A; color: #FAFAFA; margin: 0; padding: 24px; }
  .card { background: #1A1A1A; border-radius: 8px; padding: 24px; max-width: 560px; margin: 0 auto; }
  .accent { color: #DC2626; }
  a { color: #DC2626; }
`;

function wrap(title: string, body: string) {
  return `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="card"><h1 class="accent">${brand}</h1><h2>${title}</h2>${body}<p style="margin-top:24px;color:#a3a3a3;font-size:12px;">© ${new Date().getFullYear()} ${brand} · noirroutes.com</p></div></body></html>`;
}

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Welcome to ${brand}`,
    html: wrap("Welcome aboard", `<p>Hi ${name},</p><p>Your ${brand} account is ready. Complete onboarding to unlock your workspace.</p>`),
  });
}

export async function sendPaymentConfirmedEmail(to: string, amount: string) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `${brand} — Payment confirmed`,
    html: wrap("Payment confirmed", `<p>We received your payment of <strong>${amount}</strong>. Thank you for choosing ${brand}.</p>`),
  });
}

export async function sendPaymentFailedEmail(to: string) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `${brand} — Payment failed`,
    html: wrap("Payment failed", `<p>Your recent payment could not be processed. Update your billing details in the dashboard to avoid service interruption.</p>`),
  });
}

export async function sendSubscriptionCanceledEmail(to: string) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `${brand} — Subscription canceled`,
    html: wrap("Subscription canceled", `<p>Your subscription has been canceled. You retain access until the end of your billing period.</p>`),
  });
}

export async function sendQuoteReceivedEmail(to: string, quoteTitle: string) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `${brand} — Quote received`,
    html: wrap("New quote", `<p>We've received your quote request: <strong>${quoteTitle}</strong>. Our team will respond shortly.</p>`),
  });
}

export async function sendOnboardingReminderEmail(to: string, step: string) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `${brand} — Complete your setup`,
    html: wrap("Finish onboarding", `<p>You're almost there. Complete the <strong>${step}</strong> step to get the most from ${brand}.</p>`),
  });
}

export async function sendTrialEndingEmail(to: string, daysLeft = 3) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `${brand} — Your trial ends soon`,
    html: wrap(
      "Trial ending",
      `<p>Your trial ends in approximately <strong>${daysLeft}</strong> day(s). Add a payment method in Billing to keep access to ${brand}.</p>`,
    ),
  });
}