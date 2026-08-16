"use client";

import { useCallback, useMemo } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { getStripeBrowser } from "@/lib/stripe/browser";

type CheckoutTarget = {
  mode?: "subscription" | "payment";
  planPriceId?: string;
  addOnPriceId?: string;
  serviceOrderId?: string;
  serviceOrderPaymentId?: string;
  servicePaymentType?: string;
  locale: string;
};

export function EmbeddedCheckoutForm(props: CheckoutTarget) {
  const stripePromise = useMemo(() => getStripeBrowser(), []);

  const fetchClientSecret = useCallback(async () => {
    const body: Record<string, string> = {
      locale: props.locale,
      mode: props.mode ?? "subscription",
      ui_mode: "embedded",
    };
    if (props.planPriceId) body.plan_price_id = props.planPriceId;
    if (props.addOnPriceId) body.add_on_price_id = props.addOnPriceId;
    if (props.serviceOrderId) body.service_order_id = props.serviceOrderId;
    if (props.serviceOrderPaymentId) {
      body.service_order_payment_id = props.serviceOrderPaymentId;
    }
    if (props.servicePaymentType) body.service_payment_type = props.servicePaymentType;

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error || "Unable to start checkout");
    }
    return data.clientSecret as string;
  }, [props]);

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <p className="text-sm text-muted-foreground">
        Stripe publishable key is missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable
        checkout.
      </p>
    );
  }

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
