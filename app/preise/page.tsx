"use client";

import { useState } from "react";
import type { PriceSuggestion } from "@/lib/pricing";

type Status = "idle" | "loading" | "done" | "error";

export default function PreisePage() {
  const [form, setForm] = useState({
    marke: "",
    kategorie: "",
    zustand: "Sehr gut",
    groesse: "",
    beschreibung: "",
  });
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function calculate() {
    setStatus("loading");
    setError(null);
    setSuggestion(null);
    setSaved(false);
    try {
      const res = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler bei der Berechnung.");
      setSuggestion(data.suggestion as PriceSuggestion);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setStatus("error");
    }
  }

  async function saveToInventory() {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel: `${form.marke} ${form.kategorie}`.trim() || "Artikel",
        marke: form.marke,
        kategorie: form.kategorie,
        groesse: form.groesse,
        zustand: form.zustand,
        einkaufspreisEur: 0,
      }),
    });
    if (res.ok) setSaved(true);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Preisrechner</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Merkmale eingeben → KI schätzt eine realistische Vinted-Preisspanne (Modul M3).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Marke">
          <input
            className="input"
            value={form.marke}
            onChange={(e) => update("marke", e.target.value)}
            placeholder="z. B. Levi's"
          />
        </Field>
        <Field label="Kategorie">
          <input
            className="input"
            value={form.kategorie}
            onChange={(e) => update("kategorie", e.target.value)}
            placeholder="z. B. Jeansjacke"
          />
        </Field>
        <Field label="Zustand">
          <select
            className="input"
            value={form.zustand}
            onChange={(e) => update("zustand", e.target.value)}
          >
            {["Neu mit Etikett", "Neuwertig", "Sehr gut", "Gut", "Akzeptabel"].map(
              (z) => (
                <option key={z}>{z}</option>
              ),
            )}
          </select>
        </Field>
        <Field label="Größe">
          <input
            className="input"
            value={form.groesse}
            onChange={(e) => update("groesse", e.target.value)}
            placeholder="z. B. M"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Beschreibung (optional)">
            <textarea
              className="input"
              rows={2}
              value={form.beschreibung}
              onChange={(e) => update("beschreibung", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <button
        onClick={calculate}
        disabled={status === "loading" || !form.marke || !form.kategorie}
        className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {status === "loading" ? "Berechne …" : "Preis schätzen"}
      </button>

      {status === "error" && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {suggestion && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-lg font-semibold text-emerald-700">
            {suggestion.empfohlenEur.toFixed(2)} €
          </p>
          <p className="text-sm text-neutral-600">
            Spanne {suggestion.minEur.toFixed(2)} – {suggestion.maxEur.toFixed(2)} € ·
            Konfidenz: {suggestion.konfidenz} · Quelle: {suggestion.quelle}
          </p>
          <p className="mt-2 text-sm text-neutral-700">{suggestion.begruendung}</p>

          <button
            onClick={saveToInventory}
            disabled={saved}
            className="mt-3 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {saved ? "Im Inventar gespeichert ✓" : "Ins Inventar übernehmen"}
          </button>
        </div>
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid #d4d4d4;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: white;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}
