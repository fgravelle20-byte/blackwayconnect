import { setRequestLocale } from "next-intl/server";
import { QuotesClient } from "@/components/dashboard/quotes-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <QuotesClient />;
}
