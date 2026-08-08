import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/section";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const items = [
    ["q1", "a1"], ["q2", "a2"], ["q3", "a3"], ["q4", "a4"],
  ] as const;
  return (
    <MarketingSection title={t("title")}>
      <div className="space-y-6">
        {items.map(([q, a]) => (
          <div key={q}>
            <h3 className="font-medium">{t(q)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(a)}</p>
          </div>
        ))}
      </div>
    </MarketingSection>
  );
}
