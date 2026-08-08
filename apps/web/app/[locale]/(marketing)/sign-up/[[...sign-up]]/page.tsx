import { SignUp } from "@clerk/nextjs";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key || key.includes("placeholder")) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-sm text-muted-foreground">
        Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable sign-up.
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 py-16">
      <SignUp
        routing="path"
        path={`/${locale}/sign-up`}
        signInUrl={`/${locale}/sign-in`}
      />
    </div>
  );
}
