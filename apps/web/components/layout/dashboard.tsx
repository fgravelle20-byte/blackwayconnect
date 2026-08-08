import Link from "next/link";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/website-builder", label: "Website Builder" },
  { href: "/dashboard/seo", label: "SEO Engine" },
  { href: "/dashboard/chatbots", label: "Chatbots" },
  { href: "/dashboard/business", label: "Business" },
  { href: "/dashboard/social", label: "Social" },
  { href: "/dashboard/quotes", label: "Quotes" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/subscriptions", label: "Subscriptions" },
  { href: "/dashboard/billing", label: "Billing Portal" },
  { href: "/dashboard/files", label: "Files" },
  { href: "/dashboard/support", label: "Support" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 px-4 py-4">
        <Link href="/dashboard" className="text-xs font-bold tracking-[0.18em]">
          NoirRoutes
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white",
              pathname === item.href && "bg-neutral-900 text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function DashboardHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
      <OrganizationSwitcher
        hidePersonal
        afterSelectOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "flex items-center",
          },
        }}
      />
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
