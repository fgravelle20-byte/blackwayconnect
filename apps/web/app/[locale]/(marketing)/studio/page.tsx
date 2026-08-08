import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/section";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const serviceHrefs = [
  "/services/web-development",
  "/services/app-development",
  "/services/seo",
  "/services/automation",
  "/services/website-redesign",
] as const;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("studio");
  const services = await getTranslations("services");

  const cards = [
    { href: serviceHrefs[0], title: services("web.title"), body: services("web.body") },
    { href: serviceHrefs[1], title: services("app.title"), body: services("app.body") },
    { href: serviceHrefs[2], title: services("seo.title"), body: services("seo.body") },
    { href: serviceHrefs[3], title: services("automation.title"), body: services("automation.body") },
    { href: serviceHrefs[4], title: services("redesign.title"), body: services("redesign.body") },
  ];

  return (
    <MarketingSection title={t("title")} subtitle={t("subtitle")}>
      <ul className="mb-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.href} className="space-y-2 border-t border-border pt-5">
            <h3 className="text-lg font-medium tracking-tight">{card.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            <Link href={card.href} className="text-sm text-primary hover:underline">
              →
            </Link>
          </li>
        ))}
      </ul>
      <Button asChild>
        <Link href="/request-quote">{t("cta")}</Link>
      </Button>
    </MarketingSection>
  );
}
