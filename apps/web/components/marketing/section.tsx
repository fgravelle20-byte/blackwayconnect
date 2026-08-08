import { cn } from "@/lib/utils";

export function MarketingSection({
  title,
  subtitle,
  children,
  className,
  id,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-4 py-16 md:py-20", className)}>
      <div className="mb-10 max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-3 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
