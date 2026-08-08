import { setRequestLocale } from "next-intl/server";
import { LeadsClient } from "@/components/dashboard/leads-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LeadsClient />;
}
