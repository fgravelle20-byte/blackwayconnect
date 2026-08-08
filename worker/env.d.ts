/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: Fetcher;
  PIPE_URL: string;
  BW_LEAD_KEY: string;
  /** Optional Base44 Admin/SDK key — server-side only */
  BW_BASE44_API_KEY?: string;
  APP_WEB_URL?: string;
  APP_STORE_URL?: string;
  PLAY_STORE_URL?: string;
  AI?: Ai;
  OPENAI_API_KEY?: string;
}
