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

export function portalReturnUrl(locale = "en") {
  return appUrl(`/${locale}/dashboard/billing`);
}
