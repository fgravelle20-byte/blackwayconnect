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
            ? "Entitlements are active; module UI ships in a later phase."
            : "Upgrade your plan to unlock this module."
        }
      />
    </div>
  );
}
