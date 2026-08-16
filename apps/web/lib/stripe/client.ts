import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    stripe = new Stripe(key, {
      // Latest Dahlia pin for embedded_page + integration_identifier
      apiVersion: "2026-07-29.dahlia" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripe;
}
