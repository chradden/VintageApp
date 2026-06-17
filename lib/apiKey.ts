// Client-Helfer: optionaler API-Key für die KI-Routen. Der Key wird vom Nutzer
// einmal eingegeben und im Browser (localStorage) gespeichert – er taucht nicht
// im JS-Bundle auf. Wird als Header "x-app-key" mitgesendet.
const STORAGE_KEY = "vintageapp_api_key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setApiKey(value: string): void {
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(STORAGE_KEY, value);
  else localStorage.removeItem(STORAGE_KEY);
}

/** Header-Objekt mit x-app-key, falls ein Key gesetzt ist. */
export function authHeaders(): Record<string, string> {
  const key = getApiKey();
  return key ? { "x-app-key": key } : {};
}
