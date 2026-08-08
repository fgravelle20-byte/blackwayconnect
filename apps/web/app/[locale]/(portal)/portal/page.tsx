import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateProfile, resolveOrganization } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("portal");

  const { userId } = await auth();
  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const profile = await getOrCreateProfile();
  const org = await resolveOrganization();
  let role: string | null = null;
  if (profile && org) {
    const sb = createAdminSupabaseClient();
    const { data } = await sb
      .from("organization_members")
      .select("role")
      .eq("organization_id", org.id)
      .eq("profile_id", profile.id)
      .maybeSingle();
    role = data?.role ?? null;
  }

  // Portal is intended for client role; owners/admins still see the shell in Phase 1.
  const isClient = role === "client";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-8">
        <EmptyState
          title={isClient ? "Client portal shell" : "Portal shell"}
          description={
            isClient
              ? "Quotes, invoices, and documents for clients unlock in a later phase."
              : "Signed in. Client-scoped quotes, invoices, and documents unlock in a later phase."
          }
        />
      </div>
    </div>
  );
}
