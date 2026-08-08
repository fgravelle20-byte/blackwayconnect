import { getTranslations, setRequestLocale } from "next-intl/server";
import { PricingSections } from "@/components/marketing/pricing-sections";

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-16">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </div>
      <PricingSections />
    </div>
  );
}
