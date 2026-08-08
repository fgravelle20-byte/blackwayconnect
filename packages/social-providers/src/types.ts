export type SocialPlatformKey =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "x"
  | "tiktok"
  | "youtube"
  | "threads"
  | "google_business"
  | "pinterest";

export type SocialCapabilities = {
  oauth: boolean;
  publish: boolean;
  schedule: boolean;
  analytics: boolean;
  media_types: string[];
};

export type ProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export interface SocialProvider {
  key: SocialPlatformKey;
  getCapabilities(): SocialCapabilities;
  connect?(redirectUri: string): Promise<ProviderResult<{ authUrl: string }>>;
  disconnect?(accountId: string): Promise<ProviderResult<void>>;
  publish?(payload: unknown): Promise<ProviderResult<{ externalId: string }>>;
  fetchAnalytics?(externalId: string): Promise<ProviderResult<unknown>>;
}
