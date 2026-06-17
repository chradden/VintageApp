"use client";

import { useEffect, useState } from "react";
import type { Item, Transaction } from "@/lib/store";
import type { FinanceMetrics } from "@/lib/finance";

interface Snapshot {
  items: Item[];
  transactions: Transaction[];
  metrics: FinanceMetrics;
}

export default function FinanzenPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/items");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fehler beim Laden.");
      setData(json as Snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Finanzübersicht</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Umsatz, Gewinn, Gebühren, Lagerwert und ROI deines Inventars (Modul M4).
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {data && (
        <>
          <Metrics m={data.metrics} />
          <AddItem onAdded={load} />
          <Inventory items={data.items} onSold={load} />
        </>
      )}
    </main>
  );
}

function Metrics({ m }: { m: FinanceMetrics }) {
  const cards: [string, string][] = [
    ["Umsatz", `${m.umsatzEur.toFixed(2)} €`],
    ["Gewinn", `${m.gewinnEur.toFixed(2)} €`],
    ["Kosten (Gebühren+Versand)", `${m.kostenEur.toFixed(2)} €`],
    ["Wareneinsatz", `${m.wareneinsatzEur.toFixed(2)} €`],
    ["Lagerwert", `${m.lagerwertEur.toFixed(2)} €`],
    ["ROI", m.roiProzent === null ? "–" : `${m.roiProzent.toFixed(1)} %`],
    ["Verkauft", String(m.anzahlVerkauft)],
    ["Verfügbar", String(m.anzahlVerfuegbar)],
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-neutral-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
          <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function AddItem({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState({ titel: "", marke: "", einkaufspreisEur: "" });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel: form.titel,
        marke: form.marke,
        einkaufspreisEur: Number(form.einkaufspreisEur) || 0,
      }),
    });
    setForm({ titel: "", marke: "", einkaufspreisEur: "" });
    setBusy(false);
    onAdded();
  }

  return (
    <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold">Artikel ins Inventar aufnehmen</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <input
          className="fin-input sm:col-span-2"
          placeholder="Titel"
          value={form.titel}
          onChange={(e) => setForm({ ...form, titel: e.target.value })}
        />
        <input
          className="fin-input"
          placeholder="Marke"
          value={form.marke}
          onChange={(e) => setForm({ ...form, marke: e.target.value })}
        />
        <input
          className="fin-input"
          type="number"
          placeholder="Einkauf €"
          value={form.einkaufspreisEur}
          onChange={(e) => setForm({ ...form, einkaufspreisEur: e.target.value })}
        />
      </div>
      <button
        onClick={submit}
        disabled={busy || !form.titel}
        className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        Hinzufügen
      </button>
      <style jsx>{`
        :global(.fin-input) {
          width: 100%;
          border: 1px solid #d4d4d4;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function Inventory({ items, onSold }: { items: Item[]; onSold: () => void }) {
  if (items.length === 0) {
    return <p className="mt-8 text-sm text-neutral-500">Noch keine Artikel im Inventar.</p>;
  }
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold">Inventar</h2>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <InventoryRow key={item.id} item={item} onSold={onSold} />
        ))}
      </div>
    </div>
  );
}

function InventoryRow({ item, onSold }: { item: Item; onSold: () => void }) {
  const [open, setOpen] = useState(false);
  const [sale, setSale] = useState({ verkaufspreisEur: "", gebuehrenEur: "", versandEur: "" });

  async function sell() {
    await fetch(`/api/items/${item.id}/sell`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verkaufspreisEur: Number(sale.verkaufspreisEur) || 0,
        gebuehrenEur: Number(sale.gebuehrenEur) || 0,
        versandEur: Number(sale.versandEur) || 0,
      }),
    });
    setOpen(false);
    onSold();
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="font-medium">{item.titel || "(ohne Titel)"}</span>
          <span className="ml-2 text-neutral-500">
            {item.marke} · Einkauf {item.einkaufspreisEur.toFixed(2)} €
          </span>
        </div>
        {item.status === "verkauft" ? (
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs">
            verkauft
          </span>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
          >
            Verkauft melden
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <input
            className="row-input"
            type="number"
            placeholder="Verkauf €"
            value={sale.verkaufspreisEur}
            onChange={(e) => setSale({ ...sale, verkaufspreisEur: e.target.value })}
          />
          <input
            className="row-input"
            type="number"
            placeholder="Gebühren €"
            value={sale.gebuehrenEur}
            onChange={(e) => setSale({ ...sale, gebuehrenEur: e.target.value })}
          />
          <input
            className="row-input"
            type="number"
            placeholder="Versand €"
            value={sale.versandEur}
            onChange={(e) => setSale({ ...sale, versandEur: e.target.value })}
          />
          <button
            onClick={sell}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Speichern
          </button>
          <style jsx>{`
            :global(.row-input) {
              width: 100%;
              border: 1px solid #d4d4d4;
              border-radius: 0.5rem;
              padding: 0.375rem 0.5rem;
              font-size: 0.8125rem;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
