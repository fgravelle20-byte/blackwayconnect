export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Sentry init when DSN is present — full config in Phase 1 deploy
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import("@sentry/nextjs").then((Sentry) => {
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          tracesSampleRate: 0.1,
        });
      });
    }
  }
}
