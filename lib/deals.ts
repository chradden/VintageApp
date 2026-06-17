import { getPriceSuggestion, type PriceSuggestion } from "./pricing";

// Modul M5 – Produktfindung (Bewertungs-Engine).
//
// HINWEIS (siehe docs/KONZEPT.md §5): Automatisiertes Durchsuchen/Scraping von
// Vinted bzw. die Nutzung der privaten API berührt die Vinted-AGB und ist an
// eine rechtliche Bewertung gebunden. Daher liefert dieses Modul KEINEN
// Live-Crawler. Es bewertet ausschließlich Kandidaten, die der Nutzer einspeist
// (oder die ein später eingesteckter, AGB-konformer DealSource liefert), gegen
// die Marktpreis-Schätzung aus M3.

export interface DealCandidate {
  titel: string;
  marke: string;
  kategorie: string;
  zustand: string;
  groesse?: string;
  angebotspreisEur: number;
  url?: string;
}

export type DealRating = "Top-Deal" | "Guter Deal" | "Marginal" | "Kein Deal";

export interface EvaluatedDeal {
  candidate: DealCandidate;
  marktpreis: PriceSuggestion;
  margeEur: number; // empfohlener Marktpreis - Angebotspreis
  margeProzent: number; // Marge / Angebotspreis
  rating: DealRating;
}

/** Schnittstelle für eine (später) AGB-konforme Datenquelle. Aktuell nicht implementiert. */
export interface DealSource {
  find(query: string): Promise<DealCandidate[]>;
}

/** Bewertet einen Kandidaten gegen die M3-Marktpreis-Schätzung. */
export async function evaluateDeal(c: DealCandidate): Promise<EvaluatedDeal> {
  const marktpreis = await getPriceSuggestion({
    marke: c.marke,
    kategorie: c.kategorie,
    zustand: c.zustand,
    groesse: c.groesse,
    beschreibung: c.titel,
  });

  const margeEur = round(marktpreis.empfohlenEur - c.angebotspreisEur);
  const margeProzent =
    c.angebotspreisEur > 0 ? round((margeEur / c.angebotspreisEur) * 100) : 0;

  return {
    candidate: c,
    marktpreis,
    margeEur,
    margeProzent,
    rating: rate(margeProzent, marktpreis.konfidenz),
  };
}

/** Bewertet mehrere Kandidaten und sortiert nach Marge (absteigend). */
export async function evaluateDeals(
  candidates: DealCandidate[],
): Promise<EvaluatedDeal[]> {
  const evaluated = await Promise.all(candidates.map(evaluateDeal));
  return evaluated.sort((a, b) => b.margeEur - a.margeEur);
}

function rate(margeProzent: number, konfidenz: PriceSuggestion["konfidenz"]): DealRating {
  if (margeProzent >= 50 && konfidenz !== "niedrig") return "Top-Deal";
  if (margeProzent >= 20) return "Guter Deal";
  if (margeProzent >= 0) return "Marginal";
  return "Kein Deal";
}

function round(x: number): number {
  return Math.round(x * 100) / 100;
}
