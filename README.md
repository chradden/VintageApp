# VintageApp

VintageApp ist ein integriertes „Professional Reseller Toolkit" für Vinted: KI-gestütztes
Listing aus Fotos, getragen aussehende Produktbilder, datenbasierte Preisvorschläge und eine
Finanzübersicht – gebündelt in einer Web-App.

Das vollständige Produkt- und Architektur-Konzept findest du in
**[`docs/KONZEPT.md`](docs/KONZEPT.md)**.

## Status

- **Phase 0 (Scaffold):** Next.js 15 + TypeScript + Tailwind v4 ✅
- **Phase 1 (M1 – KI-Listing aus Foto):** MVP ✅ – Foto hochladen → Titel, Beschreibung,
  Marke, Größe, Kategorie, Zustand, Hashtags und Preisvorschlag.
- **Phase 2:**
  - **M3 – Preisvorschläge** ✅ – Preisrechner (`/preise`): Merkmale → KI-Preisspanne mit
    Konfidenz, hinter `PriceProvider`-Interface (echte Vinted-Vergleichsdaten als späterer
    Provider einsteckbar).
  - **M4 – Finanzübersicht** ✅ – Dashboard (`/finanzen`): Inventar pflegen, Verkäufe
    melden, Kennzahlen (Umsatz, Gewinn, Kosten, Wareneinsatz, Lagerwert, ROI).

## Setup

```bash
npm install
cp .env.example .env          # ANTHROPIC_API_KEY eintragen
npm run dev                   # http://localhost:3000
```

Benötigt einen Anthropic API-Key (`ANTHROPIC_API_KEY`). Das Modell ist über
`ANTHROPIC_MODEL` konfigurierbar (Default: `claude-opus-4-8`).

## Aufbau

| Pfad | Zweck |
|------|-------|
| `app/page.tsx` | Upload-UI + Listing-Anzeige (M1) |
| `app/preise/page.tsx` | Preisrechner-UI (M3) |
| `app/finanzen/page.tsx` | Finanz-Dashboard (M4) |
| `app/api/listing/route.ts` | Foto → KI-Listing |
| `app/api/price/route.ts` | Merkmale → Preisvorschlag |
| `app/api/items/...` | Inventar (CRUD) + Verkauf melden |
| `lib/listing.ts` | M1-Kern: Vision-LLM → Listing-JSON |
| `lib/pricing.ts` | M3-Kern: `PriceProvider` (LLM-Schätzung) |
| `lib/store.ts` | M4: datei-basierter Store (Postgres-Ziel kapselt) |
| `lib/finance.ts` | M4: Kennzahlen-Berechnung |
| `docs/KONZEPT.md` | Produkt- & Architektur-Konzept |

## Skripte

- `npm run dev` – Entwicklungsserver
- `npm run build` / `npm run start` – Produktion
- `npm run typecheck` – TypeScript prüfen
