import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClerkSupabaseClient, getActiveOrganization } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/empty-state";
import { auth } from "@clerk/nextjs/server";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const { orgId } = await auth();
  const organization = await getActiveOrganization(orgId);
  if (!organization) return <EmptyState title={t("noOrg")} />;

  try {
    // RLS-aware path: Clerk JWT template `supabase` when configured (see ADR-001)
    const sb = await createClerkSupabaseClient();
    const { data: docs, error } = await sb
      .from("documents")
      .select("*")
      .eq("organization_id", organization.id);

    if (error) {
      // Template missing or JWT not accepted yet — empty rather than crash
      return <EmptyState title={t("empty")} description="No files uploaded yet." />;
    }
    if (!docs?.length) {
      return <EmptyState title={t("empty")} description="No files uploaded yet." />;
    }
    return (
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="rounded border border-border px-3 py-2 text-sm">
            {d.name}
          </li>
        ))}
      </ul>
    );
  } catch {
    return <EmptyState title={t("empty")} />;
  }
}
