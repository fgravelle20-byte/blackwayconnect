import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@noirroutes/database",
    "@noirroutes/ui-tokens",
    "@noirroutes/social-providers",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

const intlConfig = withNextIntl(nextConfig);

// Wrap only when DSN is set; missing SENTRY_AUTH_TOKEN disables sourcemap upload
// so local/CI builds without the token still succeed.
const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryEnabled
  ? withSentryConfig(intlConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      disableLogger: true,
      widenClientFileUpload: true,
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
    })
  : intlConfig;