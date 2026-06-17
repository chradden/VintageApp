"use client";

import { useState } from "react";
import type { Listing } from "@/lib/listing";
import WornLook from "./components/WornLook";

type Status = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<{ base64: string; mediaType: string } | null>(
    null,
  );
  const [listing, setListing] = useState<Listing | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("loading");
    setError(null);
    setListing(null);

    const dataUrl = await readAsDataUrl(file);
    setPreview(dataUrl);
    const base64 = dataUrl.split(",")[1];
    setImage({ base64, mediaType: file.type });

    try {
      const res = await fetch("/api/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler bei der Generierung.");
      setListing(data.listing as Listing);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">VintageApp</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Foto hochladen → KI erstellt ein fertiges Vinted-Listing (Titel,
          Beschreibung, Details, Hashtags, Preisvorschlag).
        </p>
      </header>

      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white px-6 py-10 text-center transition hover:border-neutral-400"
      >
        <span className="text-sm font-medium">
          Produktfoto auswählen
        </span>
        <span className="mt-1 text-xs text-neutral-500">
          JPG, PNG, WEBP oder GIF
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>

      {preview && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Vorschau"
              className="w-full rounded-xl border border-neutral-200 object-cover"
            />
          </div>

          <div>
            {status === "loading" && (
              <p className="text-sm text-neutral-600">
                KI analysiert das Foto …
              </p>
            )}
            {status === "error" && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {listing && <ListingView listing={listing} />}
          </div>
        </div>
      )}

      {image && (
        <WornLook
          imageBase64={image.base64}
          mediaType={image.mediaType}
          description={listing?.titel}
        />
      )}
    </main>
  );
}

function ListingView({ listing }: { listing: Listing }) {
  const { preisvorschlag: p } = listing;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveToInventory() {
    setSaving(true);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel: listing.titel,
        marke: listing.marke,
        kategorie: listing.kategorie,
        groesse: listing.groesse,
        zustand: listing.zustand,
        einkaufspreisEur: 0,
      }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{listing.titel}</h2>
        <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">
          {listing.beschreibung}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Detail label="Marke" value={listing.marke} />
        <Detail label="Größe" value={listing.groesse} />
        <Detail label="Kategorie" value={listing.kategorie} />
        <Detail label="Zustand" value={listing.zustand} />
        <Detail label="Farbe" value={listing.farbe} />
        <Detail label="Material" value={listing.material} />
      </dl>

      <div className="rounded-lg bg-emerald-50 p-3">
        <p className="text-sm font-semibold text-emerald-800">
          Preisvorschlag: {p.empfohlen_eur.toFixed(2)} €
        </p>
        <p className="text-xs text-emerald-700">
          Spanne {p.min_eur.toFixed(2)} – {p.max_eur.toFixed(2)} €
        </p>
        <p className="mt-1 text-xs text-emerald-700">{p.begruendung}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {listing.hashtags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-neutral-200 px-2 py-1 text-xs text-neutral-700"
          >
            #{tag}
          </span>
        ))}
      </div>

      <button
        onClick={saveToInventory}
        disabled={saving || saved}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        {saved
          ? "Im Inventar gespeichert ✓"
          : saving
            ? "Speichere …"
            : "Ins Inventar übernehmen"}
      </button>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}
