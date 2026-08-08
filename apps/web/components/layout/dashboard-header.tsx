"use client";

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function clerkReady() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key && !key.includes("placeholder") && key.length > 20);
}

export function DashboardHeader({ title }: { title: string }) {
  const brand = useTranslations("brand");
  const ready = clerkReady();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {brand("name")}
        </p>
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {ready ? (
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/onboarding"
            afterSelectOrganizationUrl="/dashboard"
          />
        ) : null}
        <Link
          href="/pricing"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Pricing
        </Link>
        {ready ? <UserButton /> : null}
      </div>
    </header>
  );
}
