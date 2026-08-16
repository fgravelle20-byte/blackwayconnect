import Link from "next/link";
import { Button } from "@/components/ui/button";

const BRAND = "VORIXA";

const nav = (locale: string) => [
  { href: `/${locale}/platform`, label: "Platform" },
  { href: `/${locale}/studio`, label: "Studio" },
  { href: `/${locale}/pricing`, label: "Pricing" },
  { href: `/${locale}/why-noirroutes`, label: "Why us" },
  { href: `/${locale}/request-quote`, label: "Get a quote" },
];

/** Legacy static header — prefer `marketing-header.tsx` (i18n). */
export function MarketingHeader({ locale = "en" }: { locale?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-[#0A0A0A]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-sm font-bold tracking-[0.2em]">
          {BRAND}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {nav(locale).map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-neutral-400 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={locale === "en" ? "/fr" : "/en"} className="text-xs text-neutral-500 hover:text-white">
            {locale === "en" ? "FR" : "EN"}
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Start</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/** Legacy static footer — prefer `marketing-footer.tsx` (i18n). */
export function MarketingFooter({ locale = "en" }: { locale?: string }) {
  return (
    <footer className="border-t border-neutral-800 bg-[#0A0A0A]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="text-sm font-bold tracking-[0.2em]">{BRAND}</p>
          <p className="mt-2 text-sm text-neutral-400">Create. Automate. Scale.</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Product</p>
          <div className="flex flex-col gap-2 text-sm text-neutral-400">
            <Link href={`/${locale}/products/website-builder`}>Website Builder</Link>
            <Link href={`/${locale}/products/chatbot-builder`}>Chatbot Builder</Link>
            <Link href={`/${locale}/products/ecommerce`}>E-commerce Builder</Link>
            <Link href={`/${locale}/products/leads`}>Leads</Link>
            <Link href={`/${locale}/products/phone-assistance`}>Phone Assistance</Link>
            <Link href={`/${locale}/products/google-reviews`}>Google Reviews</Link>
            <Link href={`/${locale}/products/seo-engine`}>SEO Engine</Link>
            <Link href={`/${locale}/products/social-distribution`}>Social Distribution</Link>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Studio</p>
          <div className="flex flex-col gap-2 text-sm text-neutral-400">
            <Link href={`/${locale}/services/web-development`}>Web development</Link>
            <Link href={`/${locale}/services/app-development`}>App development</Link>
            <Link href={`/${locale}/request-quote`}>Request a quote</Link>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Legal</p>
          <div className="flex flex-col gap-2 text-sm text-neutral-400">
            <Link href={`/${locale}/terms`}>Terms</Link>
            <Link href={`/${locale}/privacy`}>Privacy</Link>
            <Link href={`/${locale}/support`}>Support</Link>
            <Link href={`/${locale}/faq`}>FAQ</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-900 py-4 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} {BRAND}. All rights reserved.
      </div>
    </footer>
  );
}
