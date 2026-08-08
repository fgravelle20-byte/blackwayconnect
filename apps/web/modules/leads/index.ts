/** Leads — first-class autonomous intake & CRM module. */
export const MODULE_KEY = "leads" as const;

export type LeadSource =
  | "website_form"
  | "chatbot"
  | "phone_assistance"
  | "google_review_campaign"
  | "manual"
  | "import"
  | "quote_request"
  | "other";

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost" | "archived";
