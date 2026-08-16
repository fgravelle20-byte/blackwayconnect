export function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function checkoutSuccessUrl(locale = "en") {
  return appUrl(`/${locale}/onboarding?checkout=success`);
}

export function checkoutCancelUrl(locale = "en") {
  return appUrl(`/${locale}/pricing?checkout=canceled`);
}

/** Return URL for Embedded Checkout (`ui_mode: embedded_page`). */
export function checkoutReturnUrl(locale = "en") {
  return appUrl(`/${locale}/checkout/return?session_id={CHECKOUT_SESSION_ID}`);
}

export function portalReturnUrl(locale = "en") {
  return appUrl(`/${locale}/dashboard/billing`);
}

/** Dashboard-trackable label; suffix must be 8 random letters (Stripe guidance). */
export function checkoutIntegrationIdentifier(kind: "embedded" | "hosted" = "embedded") {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `noirroutes_${kind}_${suffix}`;
}

export function stripeAutomaticTaxEnabled() {
  return process.env.STRIPE_AUTOMATIC_TAX === "true";
}
