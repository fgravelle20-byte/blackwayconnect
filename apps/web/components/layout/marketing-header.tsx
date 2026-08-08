"use client";

import { useTranslations, useLocale } from "next-intl";
import { UserButton } from "@clerk/nextjs";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/platform", key: "platform" as const },
  { href: "/studio", key: "studio" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/products/website-builder", key: "products" as const },
  { href: "/services/web-development", key: "services" as const },
  { href: "/why-noirroutes", key: "why" as const },
];

export function MarketingHeader() {
  const t = useTranslations("nav");
  const brand = useTranslations("brand");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "en" ? "fr" : "en";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-sm font-bold tracking-[0.14em] text-foreground">
          {brand("name")}
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(l.href) && "text-foreground",
              )}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={pathname || "/"}
            locale={other}
            className="px-2 text-xs uppercase text-muted-foreground hover:text-foreground"
          >
            {other}
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">{t("signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">{t("signUp")}</Link>
          </Button>
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
          !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder") ? (
            <UserButton afterSignOutUrl={`/${locale}`} />
          ) : null}
        </div>
      </div>
    </header>
  );
}
