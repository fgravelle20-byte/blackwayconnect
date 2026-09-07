import { createContext, useContext } from "react";
import type { ElectricalRequest } from "../types";

export type GMartelContextValue = {
  requests: ElectricalRequest[];
  lastRequest: ElectricalRequest | null;
  highlightedId: string | null;
  addRequest: (partial: Omit<ElectricalRequest, "id" | "createdAt" | "status" | "source"> & { source?: ElectricalRequest["source"] }) => ElectricalRequest;
  playEveningJourney: () => ElectricalRequest;
  resetDemo: () => void;
  markCallbackSent: (id: string) => void;
};

export const GMartelContext = createContext<GMartelContextValue | null>(null);

export function useGMartel() {
  const ctx = useContext(GMartelContext);
  if (!ctx) throw new Error("useGMartel outside provider");
  return ctx;
}
