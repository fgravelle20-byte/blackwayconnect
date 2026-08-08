import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/section";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("platform");
  return (
    <MarketingSection title={t("title")} subtitle={t("subtitle")}>
      <p className="mb-6 text-sm text-muted-foreground">{t("modulesBody")}</p>
      <Button asChild><Link href="/pricing">Pricing</Link></Button>
    </MarketingSection>
  );
}
