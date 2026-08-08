import { setRequestLocale } from "next-intl/server";
import { ProjectsClient } from "@/components/dashboard/projects-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProjectsClient />;
}
