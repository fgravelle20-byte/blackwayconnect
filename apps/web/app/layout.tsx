import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NoirRoutes",
    template: "%s · NoirRoutes",
  },
  description: "Create. Automate. Scale. — AI SaaS platform and Studio.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
};

function isValidClerkKey(key: string | undefined): key is string {
  if (!key) return false;
  if (key.includes("placeholder")) return false;
  return (key.startsWith("pk_test_") || key.startsWith("pk_live_")) && key.length > 20;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const content = isValidClerkKey(key) ? (
    <ClerkProvider publishableKey={key}>{children}</ClerkProvider>
  ) : (
    children
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body>{content}</body>
    </html>
  );
}
