export type {
  SocialCapabilities,
  SocialPlatformKey,
  SocialProvider,
  ProviderResult,
} from "./types";

export {
  registerProvider,
  getProvider,
  listRegisteredProviders,
} from "./registry";

import type { SocialCapabilities } from "./types";

/** Default capabilities when no OAuth provider is registered (Phase 1). */
export function unavailableCapabilities(): SocialCapabilities {
  return {
    oauth: false,
    publish: false,
    schedule: false,
    analytics: false,
    media_types: ["text"],
  };
}

/** Connect UI must only appear when OAuth is real and platform is available. */
export function canShowConnectButton(
  caps: SocialCapabilities,
  apiStatus: string,
): boolean {
  return caps.oauth === true && apiStatus !== "unavailable";
}
