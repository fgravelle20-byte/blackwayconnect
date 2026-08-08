import { setRequestLocale } from "next-intl/server";
import { SupportClient } from "@/components/dashboard/support-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SupportClient />;
}
