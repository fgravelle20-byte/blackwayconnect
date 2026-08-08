import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function MarketingPageShell({
  title,
  description,
  children,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>
      {children && <div className="mt-8">{children}</div>}
      {ctaHref && ctaLabel && (
        <Button asChild className="mt-8">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </section>
  );
}
