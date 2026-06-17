"use client";

import { useState } from "react";
import type { DealCandidate, EvaluatedDeal, DealRating } from "@/lib/deals";

type Status = "idle" | "loading" | "done" | "error";

const EMPTY: DealCandidate = {
  titel: "",
  marke: "",
  kategorie: "",
  zustand: "Sehr gut",
  groesse: "",
  angebotspreisEur: 0,
  url: "",
};

export default function FindenPage() {
  const [candidates, setCandidates] = useState<DealCandidate[]>([{ ...EMPTY }]);
  const [deals, setDeals] = useState<EvaluatedDeal[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function updateRow(i: number, patch: Partial<DealCandidate>) {
    setCandidates((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function evaluate() {
    setStatus("loading");
    setError(null);
    setDeals(null);
    const valid = candidates.filter((c) => c.marke && c.kategorie);
    try {
      const res = await fetch("/api/deals/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: valid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler bei der Bewertung.");
      setDeals(data.deals as EvaluatedDeal[]);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Produktfindung</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Bewertet Kandidaten gegen die KI-Marktpreis-Schätzung (Modul M5) und zeigt Marge
        und Deal-Einstufung.
      </p>

      <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Rechtlicher Hinweis:</strong> Dieses Modul enthält bewusst{" "}
        <em>kein</em> automatisches Durchsuchen von Vinted. Automatisiertes Scraping bzw.
        die Nutzung der privaten Vinted-API berührt die Vinted-AGB und ist erst nach
        rechtlicher Bewertung zulässig. Gib Kandidaten manuell ein – die Bewertung erfolgt
        offline gegen die Marktpreis-Schätzung.
      </div>

      <div className="mt-6 space-y-3">
        {candidates.map((c, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-6">
            <input
              className="deal-input sm:col-span-2"
              placeholder="Titel"
              value={c.titel}
              onChange={(e) => updateRow(i, { titel: e.target.value })}
            />
            <input
              className="deal-input"
              placeholder="Marke"
              value={c.marke}
              onChange={(e) => updateRow(i, { marke: e.target.value })}
            />
            <input
              className="deal-input"
              placeholder="Kategorie"
              value={c.kategorie}
              onChange={(e) => updateRow(i, { kategorie: e.target.value })}
            />
            <select
              className="deal-input"
              value={c.zustand}
              onChange={(e) => updateRow(i, { zustand: e.target.value })}
            >
              {["Neu mit Etikett", "Neuwertig", "Sehr gut", "Gut", "Akzeptabel"].map(
                (z) => (
                  <option key={z}>{z}</option>
                ),
              )}
            </select>
            <input
              className="deal-input"
              type="number"
              placeholder="Angebot €"
              value={c.angebotspreisEur || ""}
              onChange={(e) =>
                updateRow(i, { angebotspreisEur: Number(e.target.value) || 0 })
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-3">
        <button
          onClick={() => setCandidates((r) => [...r, { ...EMPTY }])}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
        >
          + Zeile
        </button>
        <button
          onClick={evaluate}
          disabled={status === "loading"}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {status === "loading" ? "Bewerte …" : "Kandidaten bewerten"}
        </button>
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {deals && (
        <div className="mt-6 space-y-2">
          {deals.map((d, i) => (
            <DealRow key={i} deal={d} />
          ))}
        </div>
      )}

      <style jsx>{`
        :global(.deal-input) {
          width: 100%;
          border: 1px solid #d4d4d4;
          border-radius: 0.5rem;
          padding: 0.5rem 0.625rem;
          font-size: 0.8125rem;
          background: white;
        }
      `}</style>
    </main>
  );
}

const RATING_STYLE: Record<DealRating, string> = {
  "Top-Deal": "bg-emerald-100 text-emerald-800",
  "Guter Deal": "bg-lime-100 text-lime-800",
  Marginal: "bg-neutral-200 text-neutral-700",
  "Kein Deal": "bg-red-100 text-red-700",
};

function DealRow({ deal }: { deal: EvaluatedDeal }) {
  const { candidate: c, marktpreis: m } = deal;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="font-medium">{c.titel || `${c.marke} ${c.kategorie}`}</span>
          <span className="ml-2 text-neutral-500">Angebot {c.angebotspreisEur.toFixed(2)} €</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${RATING_STYLE[deal.rating]}`}>
          {deal.rating}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-600">
        Marktpreis ~{m.empfohlenEur.toFixed(2)} € (Konfidenz {m.konfidenz}) · Marge{" "}
        <strong>{deal.margeEur.toFixed(2)} €</strong> ({deal.margeProzent.toFixed(0)} %)
      </p>
    </div>
  );
}
