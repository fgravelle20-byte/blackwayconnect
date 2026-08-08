"use client";

import { OrganizationProfile } from "@clerk/nextjs";

export function TeamClerkPanel() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <p className="text-sm text-muted-foreground">
        Configure Clerk to manage team members.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <OrganizationProfile routing="hash" />
    </div>
  );
}
