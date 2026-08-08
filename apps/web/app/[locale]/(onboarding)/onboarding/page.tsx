import { setRequestLocale } from "next-intl/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-16">
      <OnboardingWizard />
    </div>
  );
}
