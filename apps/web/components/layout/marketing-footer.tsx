"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function MarketingFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const brand = useTranslations("brand");
  const products = useTranslations("products");

  return (
    <footer className="border-t border-border bg-[#0A0A0A]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="text-sm font-bold tracking-[0.14em]">{brand("name")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{brand("slogan")}</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("product")}
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/platform">{nav("platform")}</Link></li>
            <li><Link href="/products/ecommerce">{products("ecommerce.title")}</Link></li>
            <li><Link href="/products/leads">{products("leads.title")}</Link></li>
            <li><Link href="/pricing">{nav("pricing")}</Link></li>
            <li><Link href="/studio">{nav("studio")}</Link></li>
            <li><Link href="/setup">Setup</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("company")}
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/why-noirroutes">{nav("why")}</Link></li>
            <li><Link href="/case-studies">{nav("caseStudies")}</Link></li>
            <li><Link href="/support">{nav("support")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("legal")}
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/faq">{nav("faq")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        {t("rights")}
      </div>
    </footer>
  );
}
