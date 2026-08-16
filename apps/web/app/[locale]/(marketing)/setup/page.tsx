import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EngineStatus } from "@/components/shared/engine-status";

type Cred = {
  key: string;
  required: boolean;
  present: boolean;
  docs: string;
  note: string;
};

function present(value: string | undefined) {
  return Boolean(value && !value.includes("placeholder") && value.length > 8);
}

export default async function SetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("setup");

  const creds: Cred[] = [
    {
      key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      required: true,
      present: present(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
      docs: "https://dashboard.clerk.com",
      note: t("clerkPublishable"),
    },
    {
      key: "CLERK_SECRET_KEY",
      required: true,
      present: present(process.env.CLERK_SECRET_KEY),
      docs: "https://dashboard.clerk.com",
      note: t("clerkSecret"),
    },
    {
      key: "CLERK_WEBHOOK_SECRET",
      required: false,
      present: present(process.env.CLERK_WEBHOOK_SECRET),
      docs: "https://dashboard.clerk.com/~/webhooks",
      note: t("clerkWebhook"),
    },
    {
      key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      required: true,
      present: present(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      docs: "https://dashboard.stripe.com/test/apikeys",
      note: t("stripePublishable"),
    },
    {
      key: "STRIPE_SECRET_KEY",
      required: true,
      present: present(process.env.STRIPE_SECRET_KEY),
      docs: "https://dashboard.stripe.com/test/apikeys",
      note: t("stripeSecret"),
    },
    {
      key: "STRIPE_WEBHOOK_SECRET",
      required: false,
      present: present(process.env.STRIPE_WEBHOOK_SECRET),
      docs: "https://dashboard.stripe.com/test/webhooks",
      note: t("stripeWebhook"),
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      required: true,
      present: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
      docs: "http://127.0.0.1:54323",
      note: t("supabaseUrl"),
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      required: true,
      present: present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      docs: "local: npx supabase status -o env",
      note: t("supabaseAnon"),
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      required: true,
      present: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
      docs: "local: npx supabase status -o env",
      note: t("supabaseService"),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-16">
      <div className="space-y-3">
        <p className="text-xs font-bold tracking-[0.2em]">VORIXA</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <EngineStatus />

      <Card>
        <CardHeader>
          <CardTitle>{t("credentialsTitle")}</CardTitle>
          <CardDescription>{t("credentialsBody")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {creds.map((c) => (
            <div
              key={c.key}
              className="flex flex-col gap-2 border-b border-border pb-4 last:border-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <code className="text-sm text-foreground">{c.key}</code>
                <p className="text-sm text-muted-foreground">{c.note}</p>
                <a
                  href={c.docs}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t("openDocs")}
                </a>
              </div>
              <Badge variant={c.present ? "default" : c.required ? "destructive" : "secondary"}>
                {c.present ? t("configured") : c.required ? t("missing") : t("optional")}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {t("fileHint")}{" "}
        <code className="text-foreground">apps/web/.env.local</code>
        {" — "}
        {t("restartHint")}
      </p>

      <Link href={`/${locale}`} className="text-sm text-primary underline-offset-4 hover:underline">
        {t("backHome")}
      </Link>
    </div>
  );
}
