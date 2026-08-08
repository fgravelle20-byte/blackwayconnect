import { currentUser } from "@clerk/nextjs/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/shared/empty-state";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const user = await currentUser();
  if (!user) return <EmptyState title={t("empty")} />;
  return (
    <div className="space-y-2 text-sm">
      <p>
        <span className="text-muted-foreground">Email:</span>{" "}
        {user.emailAddresses[0]?.emailAddress}
      </p>
      <p>
        <span className="text-muted-foreground">User ID:</span>{" "}
        <span className="font-mono text-xs">{user.id}</span>
      </p>
    </div>
  );
}
