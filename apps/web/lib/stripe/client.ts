import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    stripe = new Stripe(key, {
      // Pin when upgrading; cast keeps SDK upgrades from blocking Phase 1 builds
      apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripe;
}
