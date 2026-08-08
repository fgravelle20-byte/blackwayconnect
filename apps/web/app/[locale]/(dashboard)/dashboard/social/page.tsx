import { getTranslations, setRequestLocale } from "next-intl/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { orgHasFeature } from "@/lib/permissions";
import { resolveOrganization } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Platform = {
  id: string;
  key: string;
  name: string;
  api_status: string;
  capabilities: {
    oauth?: boolean;
    publish?: boolean;
    schedule?: boolean;
    analytics?: boolean;
  } | null;
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  let hasFeature = false;
  let platforms: Platform[] = [];

  try {
    const sb = createAdminSupabaseClient();
    const { data } = await sb
      .from("social_platforms")
      .select("id, key, name, api_status, capabilities")
      .order("name");
    platforms = (data as Platform[]) ?? [];

    const org = await resolveOrganization();
    if (org) {
      hasFeature = await orgHasFeature(org.id, "has_social_distribution");
    }
  } catch {
    platforms = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("social")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform connectors are capability-driven. Connect is only available when OAuth is enabled in the
          database.
        </p>
      </div>

      {!hasFeature ? (
        <Card>
          <CardHeader>
            <CardTitle>Plan required</CardTitle>
            <CardDescription>
              Social Distribution is available on Scale, Agency, and Enterprise plans. Upgrade to unlock.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {platforms.map((platform) => {
          const oauth = Boolean(platform.capabilities?.oauth);
          const available = platform.api_status === "available" && oauth;
          return (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{platform.name}</CardTitle>
                  <Badge variant="secondary">{platform.api_status}</Badge>
                </div>
                <CardDescription className="font-mono text-xs">{platform.key}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>OAuth: {oauth ? "ready" : "not enabled"}</p>
                <p>Publish: {platform.capabilities?.publish ? "ready" : "not enabled"}</p>
                {!available ? (
                  <p className="text-xs">
                    Connection unavailable until API capabilities are validated and enabled.
                  </p>
                ) : (
                  <p className="text-xs text-foreground">
                    OAuth connector will appear here when provider integration ships.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {platforms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No platforms seeded. Run `supabase/seed.sql` to load social_platforms.
        </p>
      ) : null}
    </div>
  );
}
