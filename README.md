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
| `app/page.tsx` | Upload-UI + Listing-Anzeige |
| `app/api/listing/route.ts` | API-Route: nimmt Foto entgegen, ruft die KI |
| `lib/listing.ts` | M1-Kern: Vision-LLM → strukturiertes Listing-JSON |
| `docs/KONZEPT.md` | Produkt- & Architektur-Konzept |

## Skripte

- `npm run dev` – Entwicklungsserver
- `npm run build` / `npm run start` – Produktion
- `npm run typecheck` – TypeScript prüfen
