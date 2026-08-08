/** Platform admin module — Phase 1 shell, Phase 6/7 full. */
export const MODULE_KEY = "admin" as const;

export { requirePlatformAdmin } from "@/lib/clerk/guards";
