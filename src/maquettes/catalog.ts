import type { MaquetteEntry } from "./types";

/** Dossier d’audit — 19 maquettes. Seule la #1 est livrée dans cette itération. */
export const MAQUETTES: MaquetteEntry[] = [
  {
    n: 1,
    slug: "g-martel",
    prospect: "G. Martel Entrepreneur Électricien",
    title: "Centre de demandes électriques VORIXA",
    irritant: "Appel hors heures, demande vague, soumission non suivie",
    status: "ready",
  },
];

export const MAQUETTE_TOTAL = 19;

export function getMaquette(slug: string): MaquetteEntry | undefined {
  return MAQUETTES.find((m) => m.slug === slug);
}
