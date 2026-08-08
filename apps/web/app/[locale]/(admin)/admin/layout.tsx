import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOrCreateProfile, isPlatformAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const links = [
  ["", "overview"],
  ["plans", "plans"],
  ["users", "users"],
  ["organizations", "organizations"],
  ["subscriptions", "subscriptions"],
  ["projects", "projects"],
  ["quotes", "quotes"],
  ["invoices", "invoices"],
  ["service-requests", "serviceRequests"],
  ["support-tickets", "supportTickets"],
  ["ai-usage", "aiUsage"],
  ["social-logs", "socialLogs"],
  ["errors", "errors"],
  ["analytics", "analytics"],
  ["settings", "settings"],
] as const;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  let allowed = false;
  try {
    const profile = await getOrCreateProfile();
    if (profile) allowed = await isPlatformAdmin(profile.id);
  } catch {
    allowed = false;
  }

  if (!allowed) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 border-r border-border bg-card p-4 md:block">
        <p className="mb-4 text-xs font-bold tracking-[0.14em]">{t("title")}</p>
        <nav className="space-y-1">
          {links.map(([slug, key]) => (
            <Link
              key={slug || "home"}
              href={slug ? `/admin/${slug}` : "/admin"}
              className="block rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {t(key)}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
