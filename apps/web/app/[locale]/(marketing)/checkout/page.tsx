import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { EmbeddedCheckoutForm } from "@/components/billing/embedded-checkout-form";
import { Link } from "@/i18n/navigation";

type Search = {
  plan_price_id?: string;
  add_on_price_id?: string;
  service_order_id?: string;
  service_order_payment_id?: string;
  service_payment_type?: string;
  mode?: string;
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  if (!session.userId) {
    redirect(`/${locale}/sign-in?redirect_url=/${locale}/checkout`);
  }

  const mode = sp.mode === "payment" ? "payment" : "subscription";
  const hasTarget = Boolean(
    sp.plan_price_id || sp.add_on_price_id || sp.service_order_id || sp.service_order_payment_id,
  );

  return (
    <div className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          <Link href="/pricing" className="underline-offset-4 hover:underline">
            Pricing
          </Link>
          <span className="mx-2">/</span>
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Complete payment</h1>
        <p className="mt-2 text-muted-foreground">
          Secure embedded Stripe Checkout. You stay on VORIXA while you pay.
        </p>
      </div>

      {!hasTarget ? (
        <p className="text-sm text-muted-foreground">
          No plan or add-on selected.{" "}
          <Link href="/pricing" className="underline-offset-4 hover:underline">
            Choose a plan
          </Link>
          .
        </p>
      ) : (
        <EmbeddedCheckoutForm
          locale={locale}
          mode={mode}
          planPriceId={sp.plan_price_id}
          addOnPriceId={sp.add_on_price_id}
          serviceOrderId={sp.service_order_id}
          serviceOrderPaymentId={sp.service_order_payment_id}
          servicePaymentType={sp.service_payment_type}
        />
      )}
    </div>
  );
}
