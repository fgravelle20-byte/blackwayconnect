import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { checkoutCancelUrl, checkoutSuccessUrl } from "@/lib/stripe/config";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { captureServerEvent } from "@/lib/posthog/server";

export type ServicePaymentType =
  | "deposit"
  | "milestone"
  | "final"
  | "one_time"
  | "recurring";

export type CheckoutModeInput = {
  mode: "subscription" | "payment";
  plan_price_id?: string;
  add_on_price_id?: string;
  service_order_id?: string;
  service_order_payment_id?: string;
  service_payment_type?: ServicePaymentType;
  locale?: string;
  userId: string;
  clerkOrgId: string;
  customerEmail?: string | null;
};

export type CheckoutResult =
  | { ok: true; url: string | null; id: string }
  | { ok: false; status: number; error: string };

type OrgRow = {
  id: string;
  stripe_customer_id: string | null;
  name: string;
};

async function ensureStripeCustomer(
  org: OrgRow,
  meta: { clerk_org_id: string; clerk_user_id: string; organization_id: string },
  email?: string | null,
): Promise<string> {
  if (org.stripe_customer_id) return org.stripe_customer_id;

  const stripe = getStripe();
  const sb = createAdminSupabaseClient();
  const customer = await stripe.customers.create({
    email: email || undefined,
    name: org.name,
    metadata: meta,
  });
  await sb.from("organizations").update({ stripe_customer_id: customer.id }).eq("id", org.id);
  return customer.id;
}

function resolveStudioAmount(
  order: { deposit_cents?: number | null; total_cents?: number | null },
  paymentType: ServicePaymentType,
  existingAmount?: number | null,
): number {
  if (existingAmount && existingAmount >= 50) return existingAmount;
  if (paymentType === "deposit") {
    return order.deposit_cents && order.deposit_cents >= 50
      ? order.deposit_cents
      : Math.max(50, Math.round((order.total_cents ?? 0) * 0.3));
  }
  if (paymentType === "final") {
    const total = order.total_cents ?? 0;
    const deposit = order.deposit_cents ?? 0;
    return Math.max(50, total - deposit);
  }
  return order.total_cents && order.total_cents >= 50 ? order.total_cents : 0;
}

/** Create a Stripe Checkout Session for plan, add-on, or studio payment. */
export async function createCheckoutSession(input: CheckoutModeInput): Promise<CheckoutResult> {
  const {
    mode,
    plan_price_id,
    add_on_price_id,
    service_order_id,
    service_order_payment_id,
    service_payment_type,
    locale = "en",
    userId,
    clerkOrgId,
    customerEmail,
  } = input;

  const sb = createAdminSupabaseClient();
  const { data: org } = await sb
    .from("organizations")
    .select("id, stripe_customer_id, name")
    .eq("clerk_org_id", clerkOrgId)
    .maybeSingle();

  if (!org) {
    return { ok: false, status: 400, error: "Organization not found" };
  }

  const baseMeta = {
    clerk_user_id: userId,
    clerk_org_id: clerkOrgId,
    organization_id: org.id,
  };

  let customerId: string;
  try {
    customerId = await ensureStripeCustomer(org as OrgRow, baseMeta, customerEmail);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create Stripe customer";
    return { ok: false, status: 502, error: message };
  }

  const stripe = getStripe();
  const successUrl = checkoutSuccessUrl(locale);
  const cancelUrl = checkoutCancelUrl(locale);

  try {
    // SaaS plan subscription
    if (mode === "subscription" && plan_price_id && !add_on_price_id) {
      const { data: planPrice } = await sb
        .from("plan_prices")
        .select("*, plans(*)")
        .eq("id", plan_price_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!planPrice?.stripe_price_id) {
        return {
          ok: false,
          status: 400,
          error: "Plan price missing stripe_price_id in database",
        };
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: planPrice.stripe_price_id, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...baseMeta,
          type: "subscription",
          plan_price_id,
          plan_id: planPrice.plan_id,
        },
        subscription_data: {
          metadata: {
            ...baseMeta,
            plan_price_id,
            plan_id: planPrice.plan_id,
          },
          trial_period_days:
            (planPrice.plans as { trial_days?: number } | null)?.trial_days || undefined,
        },
      });

      await captureServerEvent(userId, "checkout_started", {
        mode: "subscription",
        type: "subscription",
        plan_price_id,
        plan_id: planPrice.plan_id,
      });

      return { ok: true, url: session.url, id: session.id };
    }

    // Add-on (subscription or one-time payment)
    if (add_on_price_id) {
      const { data: addOnPrice } = await sb
        .from("add_on_prices")
        .select("*, add_ons(*)")
        .eq("id", add_on_price_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!addOnPrice?.stripe_price_id) {
        return {
          ok: false,
          status: 400,
          error: "Add-on price missing stripe_price_id in database",
        };
      }

      const addOn = addOnPrice.add_ons as { type?: string; id?: string } | null;
      const isRecurring =
        mode === "subscription" ||
        Boolean(addOnPrice.interval) ||
        addOn?.type === "recurring";
      const checkoutMode: Stripe.Checkout.SessionCreateParams.Mode = isRecurring
        ? "subscription"
        : "payment";

      const addonMeta = {
        ...baseMeta,
        type: "addon",
        add_on_price_id,
        add_on_id: addOnPrice.add_on_id,
      };

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: checkoutMode,
        customer: customerId,
        line_items: [{ price: addOnPrice.stripe_price_id, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: addonMeta,
      };

      if (checkoutMode === "subscription") {
        sessionParams.subscription_data = { metadata: addonMeta };
      } else {
        sessionParams.payment_intent_data = { metadata: addonMeta };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      await captureServerEvent(userId, "checkout_started", {
        mode: checkoutMode,
        type: "addon",
        add_on_price_id,
        add_on_id: addOnPrice.add_on_id,
      });

      return { ok: true, url: session.url, id: session.id };
    }

    // Studio service order payment (by payment id or order id)
    if (service_order_payment_id || service_order_id) {
      let payment: {
        id: string;
        service_order_id: string;
        type: string;
        amount_cents: number;
        status: string;
      } | null = null;
      let order: {
        id?: string;
        organization_id?: string | null;
        deposit_cents?: number | null;
        total_cents?: number | null;
      } | null = null;

      if (service_order_payment_id) {
        const { data: existingPayment } = await sb
          .from("service_order_payments")
          .select("*, service_orders(*)")
          .eq("id", service_order_payment_id)
          .maybeSingle();

        if (!existingPayment) {
          return { ok: false, status: 404, error: "Service order payment not found" };
        }
        payment = existingPayment;
        order = (existingPayment.service_orders as typeof order) ?? {};
        if (service_order_id && existingPayment.service_order_id !== service_order_id) {
          return { ok: false, status: 400, error: "service_order_id mismatch" };
        }
      } else if (service_order_id) {
        const paymentType: ServicePaymentType = service_payment_type ?? "deposit";

        const { data: foundOrder } = await sb
          .from("service_orders")
          .select("*")
          .eq("id", service_order_id)
          .maybeSingle();

        if (!foundOrder) {
          return { ok: false, status: 404, error: "Service order not found" };
        }
        order = foundOrder;

        const { data: existingPayment } = await sb
          .from("service_order_payments")
          .select("*")
          .eq("service_order_id", service_order_id)
          .eq("type", paymentType)
          .in("status", ["pending", "failed"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        payment = existingPayment;

        if (!payment) {
          const studioOrder = order;
          if (!studioOrder) {
            return { ok: false, status: 404, error: "Service order not found" };
          }
          const amountCents = resolveStudioAmount(
            {
              deposit_cents: studioOrder.deposit_cents,
              total_cents: studioOrder.total_cents,
            },
            paymentType,
            null,
          );
          if (!amountCents || amountCents < 50) {
            return { ok: false, status: 400, error: "Invalid payment amount" };
          }
          const { data: created, error: createErr } = await sb
            .from("service_order_payments")
            .insert({
              service_order_id,
              type: paymentType,
              amount_cents: amountCents,
              status: "pending",
            })
            .select("*")
            .maybeSingle();

          if (createErr || !created) {
            return {
              ok: false,
              status: 500,
              error: createErr?.message || "Failed to create payment record",
            };
          }
          payment = created;
        }
      }

      if (!payment || !order) {
        return { ok: false, status: 404, error: "Service order payment not found" };
      }
      if (order.organization_id && order.organization_id !== org.id) {
        return { ok: false, status: 403, error: "Order does not belong to organization" };
      }
      if (payment.status === "succeeded") {
        return { ok: false, status: 400, error: "Payment already completed" };
      }

      const paymentType = (payment.type as ServicePaymentType) || service_payment_type || "deposit";
      const amountCents = resolveStudioAmount(
        {
          deposit_cents: order.deposit_cents,
          total_cents: order.total_cents,
        },
        paymentType,
        payment.amount_cents,
      );

      if (!amountCents || amountCents < 50) {
        return { ok: false, status: 400, error: "Invalid payment amount" };
      }

      const brand = process.env.NEXT_PUBLIC_APP_NAME || "NoirRoutes";
      const studioMeta = {
        ...baseMeta,
        type: "studio",
        service_order_payment_id: payment.id,
        service_order_id: payment.service_order_id,
        service_payment_type: paymentType,
      };

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amountCents,
              product_data: {
                name: `${brand} Studio — ${paymentType}`,
                metadata: {
                  service_order_payment_id: payment.id,
                  service_order_id: payment.service_order_id,
                },
              },
            },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: studioMeta,
        payment_intent_data: { metadata: studioMeta },
      });

      await captureServerEvent(userId, "checkout_started", {
        mode: "payment",
        type: "studio",
        service_order_id: payment.service_order_id,
        service_order_payment_id: payment.id,
        service_payment_type: paymentType,
      });

      return { ok: true, url: session.url, id: session.id };
    }

    return { ok: false, status: 400, error: "No checkout target specified" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout session failed";
    return { ok: false, status: 502, error: message };
  }
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}
