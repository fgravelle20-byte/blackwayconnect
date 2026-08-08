import { auth } from "@clerk/nextjs/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/shared/empty-state";
import { TeamClerkPanel } from "@/components/dashboard/team-clerk-panel";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const { orgId } = await auth();
  if (!orgId) return <EmptyState title={t("noOrg")} />;
  return <TeamClerkPanel />;
}
