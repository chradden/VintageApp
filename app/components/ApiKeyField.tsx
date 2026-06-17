"use client";

import { useEffect, useState } from "react";
import { getApiKey, setApiKey } from "@/lib/apiKey";

// Kleines Eingabefeld in der Nav, um den optionalen API-Key zu hinterlegen.
// Nur relevant, wenn das Backend mit APP_API_KEY geschützt ist.
export default function ApiKeyField() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setValue(getApiKey());
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-neutral-500 hover:text-neutral-900"
        title="API-Key (nur bei geschütztem Backend nötig)"
      >
        🔑
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 shadow">
          <label className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">
            API-Key
          </label>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="nur bei geschütztem Backend"
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setApiKey(value.trim());
              setOpen(false);
            }}
            className="mt-2 w-full rounded bg-neutral-900 px-2 py-1 text-sm font-medium text-white"
          >
            Speichern
          </button>
        </div>
      )}
    </div>
  );
}
