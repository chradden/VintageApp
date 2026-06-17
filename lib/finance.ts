import type { Item, Transaction } from "./store";

// Reine Berechnungslogik für die Finanzübersicht (Modul M4) – ohne I/O,
// damit sie leicht testbar ist.
export interface FinanceMetrics {
  anzahlArtikel: number;
  anzahlVerkauft: number;
  anzahlVerfuegbar: number;
  umsatzEur: number; // Summe der Verkaufspreise
  kostenEur: number; // Gebühren + Versand
  wareneinsatzEur: number; // Einkaufspreise der verkauften Artikel
  gewinnEur: number; // Umsatz - Kosten - Wareneinsatz
  lagerwertEur: number; // Einkaufspreise der noch verfügbaren Artikel
  roiProzent: number | null; // Gewinn / Wareneinsatz
}

export function computeMetrics(
  items: Item[],
  transactions: Transaction[],
): FinanceMetrics {
  const itemById = new Map(items.map((i) => [i.id, i]));

  const umsatzEur = sum(transactions.map((t) => t.verkaufspreisEur));
  const kostenEur = sum(transactions.map((t) => t.gebuehrenEur + t.versandEur));
  const wareneinsatzEur = sum(
    transactions.map((t) => itemById.get(t.itemId)?.einkaufspreisEur ?? 0),
  );
  const gewinnEur = umsatzEur - kostenEur - wareneinsatzEur;

  const lagerwertEur = sum(
    items.filter((i) => i.status === "verfuegbar").map((i) => i.einkaufspreisEur),
  );

  return {
    anzahlArtikel: items.length,
    anzahlVerkauft: items.filter((i) => i.status === "verkauft").length,
    anzahlVerfuegbar: items.filter((i) => i.status === "verfuegbar").length,
    umsatzEur: round(umsatzEur),
    kostenEur: round(kostenEur),
    wareneinsatzEur: round(wareneinsatzEur),
    gewinnEur: round(gewinnEur),
    lagerwertEur: round(lagerwertEur),
    roiProzent: wareneinsatzEur > 0 ? round((gewinnEur / wareneinsatzEur) * 100) : null,
  };
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function round(x: number): number {
  return Math.round(x * 100) / 100;
}
