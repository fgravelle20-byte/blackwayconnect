import type { SocialPlatformKey, SocialProvider } from "./types";

const registry = new Map<SocialPlatformKey, SocialProvider>();

export function registerProvider(provider: SocialProvider) {
  registry.set(provider.key, provider);
}

export function getProvider(key: SocialPlatformKey): SocialProvider | null {
  return registry.get(key) ?? null;
}

export function listRegisteredProviders(): SocialProvider[] {
  return Array.from(registry.values());
}
