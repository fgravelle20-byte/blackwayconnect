/** Analytics module — PostHog wrappers for product funnels. */
export {
  captureEvent,
  initPostHog,
} from "@/lib/posthog/client";

export { captureServerEvent } from "@/lib/posthog/server";

export const CRITICAL_EVENTS = [
  "user_signed_up",
  "checkout_started",
  "checkout_completed",
  "addon_purchased",
  "service_order_created",
  "onboarding_started",
  "onboarding_step_completed",
  "onboarding_completed",
  "checkout_success_onboarding",
  "quote_submitted",
  "quote_request_submitted",
  "support_ticket_created",
  "project_created",
  "subscription_canceled",
  "payment_failed",
] as const;

export type CriticalEvent = (typeof CRITICAL_EVENTS)[number];
