import { EmptyState } from "@/components/shared/empty-state";

export function PhaseGate({
  title,
  laterPhase,
  gated,
  hasFeature,
}: {
  title: string;
  laterPhase: string;
  gated: string;
  hasFeature: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <EmptyState
        title={hasFeature ? laterPhase : gated}
        description={
          hasFeature
            ? "Entitlements ON — open this module route for live CRUD when wired."
            : "Buy the module or upgrade plan (Billing) to unlock."
        }
      />
    </div>
  );
}
