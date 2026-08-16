import { Resend } from "resend";
import { env } from "@/lib/env";

let resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

export const fromEmail = env.RESEND_FROM_EMAIL;

const brand = process.env.NEXT_PUBLIC_APP_NAME || "VORIXA";
const domain = "VORIXA.ca";

export type EmailLocale = "en" | "fr";

function wrap(title: string, body: string) {
  const styles = `body{font-family:system-ui,sans-serif;background:#0A0A0A;color:#FAFAFA;margin:0;padding:24px}.card{background:#1A1A1A;border-radius:8px;padding:24px;max-width:560px;margin:0 auto}.accent{color:#DC2626}`;
  return `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="card"><h1 class="accent">${brand}</h1><h2>${title}</h2>${body}<p style="margin-top:24px;color:#a3a3a3;font-size:12px;">© ${new Date().getFullYear()} ${brand} · ${domain}</p></div></body></html>`;
}

const copy = {
  en: {
    welcomeSubject: `Welcome to ${brand}`,
    welcomeTitle: "Welcome aboard",
    welcomeBody: (name: string) =>
      `<p>Hi ${name || "there"},</p><p>Your ${brand} account is ready.</p>`,
    paymentConfirmedSubject: `${brand} — Payment confirmed`,
    paymentConfirmedTitle: "Payment confirmed",
    paymentConfirmedBody: (amount: string) =>
      `<p>We received your payment${amount ? ` of <strong>${amount}</strong>` : ""}. Thank you for choosing ${brand}.</p>`,
    paymentFailedSubject: `${brand} — Payment failed`,
    paymentFailedTitle: "Payment failed",
    paymentFailedBody: `<p>Your recent payment could not be processed. Update billing in the ${brand} dashboard.</p>`,
    subscriptionCanceledSubject: `${brand} — Subscription canceled`,
    subscriptionCanceledTitle: "Subscription canceled",
    subscriptionCanceledBody: `<p>Your ${brand} subscription has been canceled.</p>`,
    quoteReceivedSubject: `${brand} — Quote request received`,
    quoteReceivedTitle: "Quote received",
    quoteReceivedBody: `<p>We received your quote request and will respond shortly.</p>`,
    onboardingReminderSubject: `${brand} — Complete your setup`,
    onboardingReminderTitle: "Finish onboarding",
    onboardingReminderBody: (step: string) =>
      `<p>Complete the <strong>${step}</strong> step to get started with ${brand}.</p>`,
    onboardingSubject: `Welcome to ${brand} — complete onboarding`,
    onboardingTitle: "Onboarding",
    onboardingBody: (name: string) =>
      `<p>Hi ${name || "there"},</p><p>Complete onboarding to unlock your ${brand} workspace.</p>`,
    trialEndingSubject: `${brand} — Your trial ends soon`,
    trialEndingTitle: "Trial ending",
    trialEndingBody: (daysLeft: number) =>
      `<p>Your trial ends in approximately <strong>${daysLeft}</strong> day(s). Add a payment method in Billing to keep access.</p>`,
  },
  fr: {
    welcomeSubject: `Bienvenue sur ${brand}`,
    welcomeTitle: "Bienvenue",
    welcomeBody: (name: string) =>
      `<p>Bonjour ${name || ""},</p><p>Votre compte ${brand} est prêt.</p>`,
    paymentConfirmedSubject: `${brand} — Paiement confirmé`,
    paymentConfirmedTitle: "Paiement confirmé",
    paymentConfirmedBody: (amount: string) =>
      `<p>Nous avons reçu votre paiement${amount ? ` de <strong>${amount}</strong>` : ""}. Merci d'avoir choisi ${brand}.</p>`,
    paymentFailedSubject: `${brand} — Échec de paiement`,
    paymentFailedTitle: "Échec de paiement",
    paymentFailedBody: `<p>Votre paiement récent n'a pas pu être traité. Mettez à jour la facturation dans le tableau de bord ${brand}.</p>`,
    subscriptionCanceledSubject: `${brand} — Abonnement annulé`,
    subscriptionCanceledTitle: "Abonnement annulé",
    subscriptionCanceledBody: `<p>Votre abonnement ${brand} a été annulé.</p>`,
    quoteReceivedSubject: `${brand} — Demande de soumission reçue`,
    quoteReceivedTitle: "Soumission reçue",
    quoteReceivedBody: `<p>Nous avons reçu votre demande de soumission et vous répondrons sous peu.</p>`,
    onboardingReminderSubject: `${brand} — Terminez votre configuration`,
    onboardingReminderTitle: "Finaliser l'onboarding",
    onboardingReminderBody: (step: string) =>
      `<p>Complétez l'étape <strong>${step}</strong> pour démarrer avec ${brand}.</p>`,
    onboardingSubject: `Bienvenue sur ${brand} — finalisez l'onboarding`,
    onboardingTitle: "Onboarding",
    onboardingBody: (name: string) =>
      `<p>Bonjour ${name || ""},</p><p>Finalisez l'onboarding pour débloquer votre espace ${brand}.</p>`,
    trialEndingSubject: `${brand} — Votre essai se termine bientôt`,
    trialEndingTitle: "Fin d'essai",
    trialEndingBody: (daysLeft: number) =>
      `<p>Votre essai se termine dans environ <strong>${daysLeft}</strong> jour(s). Ajoutez un mode de paiement dans Facturation pour conserver l'accès.</p>`,
  },
} as const;

function resolveLocale(locale?: string | null): EmailLocale {
  return locale?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export const emailTemplates = {
  welcome(name?: string | null, locale?: string | null) {
    const c = copy[resolveLocale(locale)];
    return {
      subject: c.welcomeSubject,
      html: wrap(c.welcomeTitle, c.welcomeBody(name || "")),
    };
  },
  paymentConfirmed(amount = "", locale?: string | null) {
    const c = copy[resolveLocale(locale)];
    return {
      subject: c.paymentConfirmedSubject,
      html: wrap(c.paymentConfirmedTitle, c.paymentConfirmedBody(amount)),
    };
  },
  paymentFailed(locale?: string | null) {
    const c = copy[resolveLocale(locale)];
    return {
      subject: c.paymentFailedSubject,
      html: wrap(c.paymentFailedTitle, c.paymentFailedBody),
    };
  },
  subscriptionCanceled(locale?: string | null) {
    const c = copy[resolveLocale(locale)];
    return {
      subject: c.subscriptionCanceledSubject,
      html: wrap(c.subscriptionCanceledTitle, c.subscriptionCanceledBody),
    };
  },
  quoteReceived(locale?: string | null) {
    const c = copy[resolveLocale(locale)];
    return {
      subject: c.quoteReceivedSubject,
      html: wrap(c.quoteReceivedTitle, c.quoteReceivedBody),
    };
  },
  onboardingReminder(step: string, locale?: string | null) {
    const c = copy[resolveLocale(locale)];
    return {
      subject: c.onboardingReminderSubject,
      html: wrap(c.onboardingReminderTitle, c.onboardingReminderBody(step)),
    };
  },
  onboarding(name?: string | null, locale?: string | null) {
    const c = copy[resolveLocale(locale)];
    return {
      subject: c.onboardingSubject,
      html: wrap(c.onboardingTitle, c.onboardingBody(name || "")),
    };
  },
  trialEnding(daysLeft = 3, locale?: string | null) {
    const c = copy[resolveLocale(locale)];
    return {
      subject: c.trialEndingSubject,
      html: wrap(c.trialEndingTitle, c.trialEndingBody(daysLeft)),
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
    return { skipped: true as const };
  }
  const result = await client.emails.send({ from: fromEmail, to, subject, html });
  return { skipped: false as const, result };
}
