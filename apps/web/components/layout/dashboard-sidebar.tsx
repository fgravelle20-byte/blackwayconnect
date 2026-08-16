"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", key: "overview" as const },
  { href: "/dashboard/leads", key: "leads" as const },
  { href: "/dashboard/projects", key: "projects" as const },
  { href: "/dashboard/website-builder", key: "websiteBuilder" as const },
  { href: "/dashboard/ecommerce", key: "ecommerce" as const },
  { href: "/dashboard/seo", key: "seo" as const },
  { href: "/dashboard/chatbots", key: "chatbots" as const },
  { href: "/dashboard/phone-assistance", key: "phoneAssistance" as const },
  { href: "/dashboard/google-reviews", key: "googleReviews" as const },
  { href: "/dashboard/business", key: "business" as const },
  { href: "/dashboard/roi", key: "roi" as const },
  { href: "/dashboard/social", key: "social" as const },
  { href: "/dashboard/quotes", key: "quotes" as const },
  { href: "/dashboard/invoices", key: "invoices" as const },
  { href: "/dashboard/subscriptions", key: "subscriptions" as const },
  { href: "/dashboard/billing", key: "billing" as const },
  { href: "/dashboard/files", key: "files" as const },
  { href: "/dashboard/support", key: "support" as const },
  { href: "/dashboard/settings", key: "settings" as const },
  { href: "/dashboard/team", key: "team" as const },
];

export function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const brand = useTranslations("brand");
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/dashboard" className="text-xs font-bold tracking-[0.12em]">
          {brand("name")}
        </Link>
      </div>
      <nav className="space-y-0.5 p-3">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground",
              )}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
