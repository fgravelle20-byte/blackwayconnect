import { setRequestLocale } from "next-intl/server";
import { QuoteForm } from "@/components/marketing/quote-form";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <QuoteForm />
    </div>
  );
}
