"use client";

import { useState } from "react";
import { authHeaders } from "@/lib/apiKey";

type Status = "idle" | "loading" | "done" | "error";

export default function WornLook({
  imageBase64,
  mediaType,
  description,
}: {
  imageBase64: string;
  mediaType: string;
  description?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setStatus("loading");
    setError(null);
    setImageUrl(null);
    try {
      const res = await fetch("/api/worn-look", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ imageBase64, mediaType, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler bei der Generierung.");
      setImageUrl(data.result.imageUrl as string);
      setProvider(data.result.provider as string);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setStatus("error");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Getragen-Look-Foto (M2)</h3>
          <p className="text-xs text-neutral-500">
            Erzeugt aus dem Flat-Lay ein „getragen" aussehendes Bild.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={status === "loading"}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {status === "loading" ? "Generiere …" : "Erzeugen"}
        </button>
      </div>

      {status === "loading" && (
        <p className="mt-3 text-xs text-neutral-500">
          Das kann bis zu einer Minute dauern …
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {imageUrl && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Getragen-Look"
            className="w-full rounded-lg border border-neutral-200"
          />
          {provider && (
            <p className="mt-1 text-xs text-neutral-500">Quelle: {provider}</p>
          )}
        </div>
      )}
    </div>
  );
}
