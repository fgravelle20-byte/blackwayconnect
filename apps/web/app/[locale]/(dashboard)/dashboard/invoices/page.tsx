import { setRequestLocale } from "next-intl/server";
import { InvoicesClient } from "@/components/dashboard/invoices-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InvoicesClient />;
}
