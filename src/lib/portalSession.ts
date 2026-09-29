const STORAGE_KEY = "bw_portal_session";
export const LEAK_SCORE_KEY = "bw_last_leak_score";
export const QUOTE_KEY = "bw_last_quote";
export const CHECKLIST_KEY = "bw_checklist_state";
export const VENDOR_KEY = "bw_tool_vendor";

export type PortalSessionLite = {
  email: string;
  forfait?: string;
};

export function readPortalSession(): PortalSessionLite | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as { email?: string; exp?: number; forfait?: string };
    if (!s.email || !s.exp || s.exp * 1000 < Date.now()) return null;
    return { email: s.email, forfait: s.forfait };
  } catch {
    return null;
  }
}

export type SavedLeakScore = {
  twin: number;
  volume: number;
  quality: number;
  leakRaw: number;
  at: string;
};

export function saveLeakScore(row: SavedLeakScore) {
  try {
    localStorage.setItem(LEAK_SCORE_KEY, JSON.stringify(row));
  } catch {
    /* ignore */
  }
}

export function readLeakScore(): SavedLeakScore | null {
  try {
    const raw = localStorage.getItem(LEAK_SCORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedLeakScore;
  } catch {
    return null;
  }
}
