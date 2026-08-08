import { NextResponse } from "next/server";
import type Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { getStripe } from "@/lib/stripe/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail, emailTemplates } from "@/lib/resend/client";
import { captureServerEvent } from "@/lib/posthog/server";

export const runtime = "nodejs";

async function alreadyProcessed(eventId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("stripe_webhook_events")
    .select("id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();
  return Boolean(data);
}

async function markProcessed(event: Stripe.Event) {
  const sb = createAdminSupabaseClient();
  await sb.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
}

async function orgByCustomer(customerId: string) {
  const sb = createAdminSupabaseClient();
  const { data } = await sb
    .from("organizations")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data;
}

async function seedSubscriptionUsage(params: {
  organizationId: string;
  subscriptionId: string;
  planId: string | null;
  periodStart: string;
  periodEnd: string;
}) {
  const sb = createAdminSupabaseClient();
  if (!params.planId) return;

  const { data: limits } = await sb
    .from("plan_limits")
    .select("limit_key")
    .eq("plan_id", params.planId);

  for (const limit of limits ?? []) {
    await sb.from("subscription_usage").upsert(
      {
        organization_id: params.organizationId,
        subscription_id: params.subscriptionId,
        limit_key: limit.limit_key,
        used_value: 0,
        period_start: params.periodStart,
        period_end: params.periodEnd,
      },
      { onConflict: "organization_id,limit_key,period_start" },
    );
  }
}

async function resetSubscriptionUsage(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data: sub } = await sb
    .from("subscriptions")
    .select("id, plan_id, current_period_start, current_period_end")
    .eq("organization_id", organizationId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.current_period_start || !sub.current_period_end) return;

  await seedSubscriptionUsage({
    organizationId,
    subscriptionId: sub.id,
    planId: sub.plan_id,
    periodStart: sub.current_period_start,
    periodEnd: sub.current_period_end,
  });
}

async function fulfillAddonCheckout(session: Stripe.Checkout.Session) {
  const sb = createAdminSupabaseClient();
  const addOnId = session.metadata?.addon_id || session.metadata?.add_on_id;
  const clerkOrgId = session.metadata?.clerk_org_id;
  if (!addOnId || !clerkOrgId) return;

  const { data: org } = await sb
    .from("organizations")
    .select("id")
    .eq("clerk_org_id", clerkOrgId)
    .maybeSingle();
  if (!org) return;

  const { data: existing } = await sb
    .from("customer_add_ons")
    .select("id")
    .eq("organization_id", org.id)
    .eq("add_on_id", addOnId)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    await sb
      .from("customer_add_ons")
      .update({
        quantity: 1,
        purchased_at: new Date().toISOString(),
        stripe_subscription_item_id: session.subscription
          ? typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id
          : null,
      })
      .eq("id", existing.id);
  } else {
    await sb.from("customer_add_ons").insert({
      organization_id: org.id,
      add_on_id: addOnId,
      quantity: 1,
      status: "active",
      purchased_at: new Date().toISOString(),
      stripe_subscription_item_id: session.subscription
        ? typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id
        : null,
    });
  }
}

async function fulfillStudioCheckout(session: Stripe.Checkout.Session) {
  const sb = createAdminSupabaseClient();
  const paymentId = session.metadata?.service_order_payment_id;
  if (!paymentId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await sb
    .from("service_order_payments")
    .update({
      status: "succeeded",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId ?? undefined,
    })
    .eq("id", paymentId);

  const orderId = session.metadata?.service_order_id;
  if (orderId) {
    await sb
      .from("service_orders")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .in("status", ["draft", "quoted", "accepted"]);
  }
}

async function ownerEmailForOrg(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data: members } = await sb
    .from("organization_members")
    .select("profiles(email)")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .limit(1);
  return (members?.[0] as { profiles?: { email?: string } } | undefined)?.profiles?.email;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (await alreadyProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const sb = createAdminSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const clerkOrgId = session.metadata?.clerk_org_id;
        const planId = session.metadata?.plan_id;
        const checkoutType = session.metadata?.type;
        const distinctId = session.metadata?.clerk_user_id || "anonymous";

        if (customerId && clerkOrgId) {
          await sb
            .from("organizations")
            .update({ stripe_customer_id: customerId })
            .eq("clerk_org_id", clerkOrgId);
        }

        if (session.mode === "subscription" && session.subscription && clerkOrgId) {
          const { data: org } = await sb
            .from("organizations")
            .select("id")
            .eq("clerk_org_id", clerkOrgId)
            .maybeSingle();
          if (org) {
            const stripeSubId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;
            const { data: subRow } = await sb
              .from("subscriptions")
              .upsert(
                {
                  organization_id: org.id,
                  stripe_subscription_id: stripeSubId,
                  plan_id: planId || null,
                  status: "active",
                },
                { onConflict: "stripe_subscription_id" },
              )
              .select("id, current_period_start, current_period_end")
              .single();

            if (subRow && planId) {
              const now = new Date();
              const periodStart =
                subRow.current_period_start ?? now.toISOString();
              const periodEnd =
                subRow.current_period_end ??
                new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
              await seedSubscriptionUsage({
                organizationId: org.id,
                subscriptionId: subRow.id,
                planId,
                periodStart,
                periodEnd,
              });
            }
          }
        }

        if (checkoutType === "addon" || session.metadata?.addon_id || session.metadata?.add_on_id) {
          await fulfillAddonCheckout(session);
          await captureServerEvent(distinctId, "addon_purchased", {
            addon_id: session.metadata?.addon_id || session.metadata?.add_on_id,
            mode: session.mode,
          });
        }

        if (checkoutType === "studio" || session.metadata?.service_order_id) {
          await fulfillStudioCheckout(session);
          await captureServerEvent(distinctId, "service_order_created", {
            service_order_id: session.metadata?.service_order_id,
            service_order_payment_id: session.metadata?.service_order_payment_id,
            mode: session.mode,
          });
        }

        if (session.customer_details?.email) {
          const amount =
            session.amount_total != null
              ? `$${(session.amount_total / 100).toFixed(2)}`
              : "your plan";
          const tmpl = emailTemplates.paymentConfirmed(amount);
          await sendTransactionalEmail({
            to: session.customer_details.email,
            ...tmpl,
          }).catch(() => undefined);
        }

        await captureServerEvent(distinctId, "checkout_completed", {
          plan_id: planId,
          mode: session.mode,
          type: checkoutType,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const org = await orgByCustomer(customerId);
        const planId = sub.metadata?.plan_id || null;
        const periodStart = new Date(
          (sub as Stripe.Subscription & { current_period_start: number }).current_period_start *
            1000,
        ).toISOString();
        const periodEnd = new Date(
          (sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000,
        ).toISOString();

        if (org) {
          const { data: subRow } = await sb
            .from("subscriptions")
            .upsert(
              {
                organization_id: org.id,
                stripe_subscription_id: sub.id,
                plan_id: planId,
                status: sub.status as
                  | "active"
                  | "trialing"
                  | "past_due"
                  | "canceled"
                  | "unpaid"
                  | "paused",
                current_period_start: periodStart,
                current_period_end: periodEnd,
                cancel_at_period_end: sub.cancel_at_period_end,
                trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
              },
              { onConflict: "stripe_subscription_id" },
            )
            .select("id")
            .single();

          if (subRow && event.type === "customer.subscription.created") {
            await seedSubscriptionUsage({
              organizationId: org.id,
              subscriptionId: subRow.id,
              planId,
              periodStart,
              periodEnd,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await sb
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", sub.id);
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const org = await orgByCustomer(customerId);
        const distinctId = sub.metadata?.clerk_user_id || org?.id || customerId;
        await captureServerEvent(distinctId, "subscription_canceled", {
          stripe_subscription_id: sub.id,
        });
        if (org) {
          const email = await ownerEmailForOrg(org.id);
          if (email) {
            const tmpl = emailTemplates.subscriptionCanceled();
            await sendTransactionalEmail({ to: email, ...tmpl }).catch(() => undefined);
          }
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const org = await orgByCustomer(customerId);
        if (org) {
          const email = await ownerEmailForOrg(org.id);
          if (email) {
            const tmpl = emailTemplates.trialEnding(3);
            await sendTransactionalEmail({ to: email, ...tmpl }).catch(() => undefined);
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const org = await orgByCustomer(customerId);
          if (org) {
            await sb.from("invoices").upsert(
              {
                organization_id: org.id,
                stripe_invoice_id: invoice.id,
                status: invoice.status,
                amount_due: invoice.amount_due,
                amount_paid: invoice.amount_paid,
                pdf_url: invoice.invoice_pdf,
                paid_at: invoice.status_transitions?.paid_at
                  ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                  : new Date().toISOString(),
              },
              { onConflict: "stripe_invoice_id" },
            );
            // Renewal: reset usage counters for the new period
            if (invoice.billing_reason === "subscription_cycle") {
              await resetSubscriptionUsage(org.id);
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        await captureServerEvent(customerId || "anonymous", "payment_failed", {
          stripe_invoice_id: invoice.id,
          amount_due: invoice.amount_due,
        });
        if (invoice.customer_email) {
          const tmpl = emailTemplates.paymentFailed();
          await sendTransactionalEmail({
            to: invoice.customer_email,
            ...tmpl,
          }).catch(() => undefined);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const paymentId = pi.metadata?.service_order_payment_id;
        if (paymentId) {
          await sb
            .from("service_order_payments")
            .update({
              status: "succeeded",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: pi.id,
            })
            .eq("id", paymentId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await captureServerEvent(pi.metadata?.clerk_user_id || "anonymous", "payment_intent_failed", {
          payment_intent_id: pi.id,
        });
        break;
      }

      default:
        break;
    }

    await markProcessed(event);
    return NextResponse.json({ received: true });
  } catch (e) {
    Sentry.captureException(e, { tags: { webhook: "stripe" } });
    const message = e instanceof Error ? e.message : "webhook_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
