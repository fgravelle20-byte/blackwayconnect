import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "VORIXA",
    appEnv: env.APP_ENV,
    time: new Date().toISOString(),
    integrations: {
      clerk: Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY),
      supabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      stripe: Boolean(env.STRIPE_SECRET_KEY),
      resend: Boolean(env.RESEND_API_KEY),
      sentry: Boolean(env.NEXT_PUBLIC_SENTRY_DSN),
      posthog: Boolean(env.NEXT_PUBLIC_POSTHOG_KEY),
    },
  });
}
