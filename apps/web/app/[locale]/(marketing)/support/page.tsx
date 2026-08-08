import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/section";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("supportPage");
  return (
    <MarketingSection title={t("title")} subtitle={t("subtitle")}>
      <div className="flex gap-3">
        <Button asChild><Link href="/dashboard/support">Open tickets</Link></Button>
        <Button asChild variant="outline"><Link href="/request-quote">Request quote</Link></Button>
      </div>
    </MarketingSection>
  );
}
