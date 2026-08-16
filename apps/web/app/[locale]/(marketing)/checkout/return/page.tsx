import { setRequestLocale } from "next-intl/server";
import { CheckoutReturnClient } from "@/components/billing/checkout-return-client";

export default async function CheckoutReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  return <CheckoutReturnClient sessionId={sp.session_id ?? null} />;
}
