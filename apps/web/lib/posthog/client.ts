"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (typeof window === "undefined" || initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com",
    capture_pageview: true,
  });
  initialized = true;
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  initPostHog();
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
}
