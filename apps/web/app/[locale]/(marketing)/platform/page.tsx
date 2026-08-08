import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/section";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("platform");
  const products = await getTranslations("products");

  const cards = [
    { href: "/products/website-builder", title: products("websiteBuilder.title"), body: products("websiteBuilder.body") },
    { href: "/products/chatbot-builder", title: products("chatbotBuilder.title"), body: products("chatbotBuilder.body") },
    { href: "/products/phone-assistance", title: products("phoneAssistance.title"), body: products("phoneAssistance.body") },
    { href: "/products/google-reviews", title: products("googleReviews.title"), body: products("googleReviews.body") },
    { href: "/products/ecommerce", title: products("ecommerce.title"), body: products("ecommerce.body") },
    { href: "/products/leads", title: products("leads.title"), body: products("leads.body") },
    { href: "/products/seo-engine", title: products("seoEngine.title"), body: products("seoEngine.body") },
    { href: "/products/social-distribution", title: products("social.title"), body: products("social.body") },
    { href: "/products/business-management", title: products("business.title"), body: products("business.body") },
  ];

  return (
    <MarketingSection title={t("title")} subtitle={t("subtitle")}>
      <p className="mb-8 text-sm text-muted-foreground">{t("modulesBody")}</p>
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
        <Link href="/pricing">Pricing</Link>
      </Button>
    </MarketingSection>
  );
}
