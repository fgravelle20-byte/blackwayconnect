import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";

export function initSentry() {
  if (!env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    environment: env.NODE_ENV,
  });
}

export { Sentry };
