/**
 * E-commerce / Boutique en ligne builder.
 * Storefront checkout remains integration_required until Stripe Connect
 * or store Checkout is implemented — do not fake payments.
 */
export const MODULE_KEY = "ecommerce" as const;
export const CHECKOUT_STATUS = "integration_required" as const;
