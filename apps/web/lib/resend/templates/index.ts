/**
 * Compatibility re-exports — prefer `@/lib/resend/client` (`emailTemplates` + `sendTransactionalEmail`).
 */
export {
  emailTemplates,
  sendTransactionalEmail,
  getResend,
  fromEmail,
  type EmailLocale,
} from "@/lib/resend/client";

import { emailTemplates, sendTransactionalEmail } from "@/lib/resend/client";

export async function sendWelcomeEmail(to: string, name: string, locale?: string) {
  const t = emailTemplates.welcome(name, locale);
  await sendTransactionalEmail({ to, ...t });
}

export async function sendPaymentConfirmedEmail(to: string, amount: string, locale?: string) {
  const t = emailTemplates.paymentConfirmed(amount, locale);
  await sendTransactionalEmail({ to, ...t });
}

export async function sendPaymentFailedEmail(to: string, locale?: string) {
  const t = emailTemplates.paymentFailed(locale);
  await sendTransactionalEmail({ to, ...t });
}

export async function sendSubscriptionCanceledEmail(to: string, locale?: string) {
  const t = emailTemplates.subscriptionCanceled(locale);
  await sendTransactionalEmail({ to, ...t });
}

export async function sendQuoteReceivedEmail(to: string, _quoteTitle?: string, locale?: string) {
  const t = emailTemplates.quoteReceived(locale);
  await sendTransactionalEmail({ to, ...t });
}

export async function sendOnboardingReminderEmail(to: string, step: string, locale?: string) {
  const t = emailTemplates.onboardingReminder(step, locale);
  await sendTransactionalEmail({ to, ...t });
}

export async function sendTrialEndingEmail(to: string, daysLeft = 3, locale?: string) {
  const t = emailTemplates.trialEnding(daysLeft, locale);
  await sendTransactionalEmail({ to, ...t });
}
