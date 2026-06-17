# VintageApp

VintageApp ist ein integriertes „Professional Reseller Toolkit" für Vinted: KI-gestütztes
Listing aus Fotos, getragen aussehende Produktbilder, datenbasierte Preisvorschläge und eine
Finanzübersicht – gebündelt in einer Web-App.

Das vollständige Produkt- und Architektur-Konzept findest du in
**[`docs/KONZEPT.md`](docs/KONZEPT.md)**.

---

## Status

- **Phase 0 (Scaffold):** Next.js 15 + TypeScript + Tailwind v4 ✅
- **Phase 1 (M1 – KI-Listing aus Foto):** Foto → Titel, Beschreibung, Marke, Größe,
  Kategorie, Zustand, Hashtags, Preisvorschlag ✅
- **Phase 2:**
  - **M3 – Preisvorschläge** ✅ – Preisrechner (`/preise`): Merkmale → KI-Preisspanne mit
    Konfidenz, hinter `PriceProvider`-Interface.
  - **M4 – Finanzübersicht** ✅ – Dashboard (`/finanzen`): Inventar, Verkäufe, Kennzahlen
    (Umsatz, Gewinn, Kosten, Wareneinsatz, Lagerwert, ROI).
- **Phase 3 (M2 – Getragen-Look-Fotos):** ✅ – aus einem Flat-Lay ein „getragen"
  aussehendes Bild via Replicate Virtual Try-On, hinter `ImageProvider`-Interface.

---

## Installation

### 1. Voraussetzungen

- **Node.js ≥ 20** (empfohlen 22). Prüfen: `node --version`.
  Installation z. B. über [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`.
- **npm ≥ 10** (kommt mit Node). Prüfen: `npm --version`.
- **git** zum Klonen des Repos.
- API-Zugänge je nach Modul (siehe Schritt 4) – für einen ersten Start genügt der
  Anthropic-Key; M4 (Finanzen) läuft komplett ohne API-Key.

### 2. Repository klonen

```bash
git clone https://github.com/chradden/vintageapp.git
cd vintageapp
```

### 3. Abhängigkeiten installieren

```bash
npm install
```

### 4. Umgebungsvariablen konfigurieren

Lege eine `.env`-Datei an (Vorlage kopieren) und trage deine Keys ein:

```bash
cp .env.example .env
```

| Variable | Pflicht für | Beschreibung |
|----------|-------------|--------------|
| `ANTHROPIC_API_KEY` | M1, M3 | API-Key von [console.anthropic.com](https://console.anthropic.com/) → *API Keys*. |
| `ANTHROPIC_MODEL` | optional | Modell-Override. Default `claude-opus-4-8`; günstiger/schneller: `claude-sonnet-4-6`. |
| `REPLICATE_API_TOKEN` | M2 | Token von [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens). |
| `TRYON_MODEL_IMAGE_URL` | M2 | Öffentlich erreichbare URL eines Personen-/Modellfotos. Das Try-On-Modell (IDM-VTON) projiziert das Kleidungsstück auf diese Person. |
| `REPLICATE_TRYON_MODEL` | optional | Try-On-Modell-Slug. Default `cuuupid/idm-vton`. |

**Minimalstart:** Nur `ANTHROPIC_API_KEY` setzen – dann funktionieren KI-Listing (M1),
Preisrechner (M3) und die komplette Finanzübersicht (M4). M2 zeigt einen klaren Hinweis,
solange Replicate nicht konfiguriert ist.

> Hinweis zu M2: IDM-VTON benötigt zwingend ein **Personenfoto** (`TRYON_MODEL_IMAGE_URL`),
> auf das das Kleidungsstück „angezogen" wird. Lade dafür ein neutrales Modellfoto an einen
> öffentlich erreichbaren Ort (z. B. Object Storage) und trage die URL ein.

### 5. Entwicklungsserver starten

```bash
npm run dev
```

App öffnen: **http://localhost:3000**

- `/` – KI-Listing aus Foto (M1) + Getragen-Look (M2)
- `/preise` – Preisrechner (M3)
- `/finanzen` – Finanzübersicht (M4)

### 6. Produktion

```bash
npm run build    # optimierten Build erzeugen
npm run start    # Produktionsserver (Default: Port 3000)
```

---

## Skripte

| Befehl | Zweck |
|--------|-------|
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm run build` | Produktions-Build |
| `npm run start` | Produktionsserver |
| `npm run typecheck` | TypeScript prüfen (`tsc --noEmit`) |
| `npm run lint` | Next.js Linting |

---

## Projektstruktur

| Pfad | Zweck |
|------|-------|
| `app/page.tsx` | Upload-UI + Listing-Anzeige (M1) + Getragen-Look (M2) |
| `app/preise/page.tsx` | Preisrechner-UI (M3) |
| `app/finanzen/page.tsx` | Finanz-Dashboard (M4) |
| `app/components/` | Nav, WornLook |
| `app/api/listing/route.ts` | Foto → KI-Listing |
| `app/api/price/route.ts` | Merkmale → Preisvorschlag |
| `app/api/worn-look/route.ts` | Flat-Lay → Getragen-Look-Bild |
| `app/api/items/...` | Inventar (CRUD) + Verkauf melden |
| `lib/listing.ts` | M1: Vision-LLM → Listing-JSON |
| `lib/pricing.ts` | M3: `PriceProvider` (LLM-Schätzung) |
| `lib/imagegen.ts` | M2: `ImageProvider` (Replicate Try-On) |
| `lib/store.ts` | M4: datei-basierter Store (`.data/store.json`) |
| `lib/finance.ts` | M4: Kennzahlen-Berechnung |
| `docs/KONZEPT.md` | Produkt- & Architektur-Konzept |

---

## Datenhaltung

Für den MVP nutzt M4 einen **datei-basierten Store** unter `.data/store.json` (per
`.gitignore` ausgeschlossen). Die Logik ist hinter `lib/store.ts` gekapselt – der Wechsel
auf PostgreSQL/Prisma (Konzept-Ziel) betrifft nur diese Datei.

---

## Fehlersuche

| Symptom | Ursache / Lösung |
|---------|------------------|
| `ANTHROPIC_API_KEY ist nicht gesetzt` | `.env` anlegen und Key eintragen, Server neu starten. |
| `Bild-KI nicht konfiguriert` (M2) | `REPLICATE_API_TOKEN` **und** `TRYON_MODEL_IMAGE_URL` setzen. |
| M2 schlägt fehl / leeres Bild | Modellfoto-URL nicht öffentlich erreichbar, oder Replicate-Modell ausgelastet. |
| Port 3000 belegt | Anderen Port nutzen: `PORT=3100 npm run dev`. |
| Änderungen an `.env` greifen nicht | Server stoppen und neu starten (ENV wird beim Start gelesen). |
