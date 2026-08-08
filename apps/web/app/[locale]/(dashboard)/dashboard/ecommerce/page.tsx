import { setRequestLocale } from "next-intl/server";
import { EcommerceClient } from "@/components/dashboard/ecommerce-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EcommerceClient />;
}
