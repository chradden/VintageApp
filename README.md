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
  aussehendes Bild via Replicate Image-Edit (FLUX Kontext), hinter `ImageProvider`-Interface.
  Kein Modellfoto nötig.
- **Phase 4 (M5 – Produktfindung):** ✅ – Bewertungs-Engine (`/finden`): Kandidaten werden
  gegen die M3-Marktpreis-Schätzung bewertet (Marge + Deal-Einstufung), hinter
  `DealSource`-Interface. **Kein Live-Crawler** – siehe rechtlicher Hinweis unten.

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

Die Text-/Vision-Module **M1, M3, M5** laufen wahlweise über **Anthropic (Claude)** oder
**OpenRouter** (OpenAI-kompatibel, inkl. günstiger Modelle wie DeepSeek/Qwen/GLM). M2
nutzt Replicate, M4 braucht keinen Key.

| Variable | Pflicht für | Beschreibung |
|----------|-------------|--------------|
| `APP_API_KEY` | optional (Deploy) | Schützt die KI-Routen. Wenn gesetzt, müssen Web-UI/Extension den Key senden. Lokal leer lassen. |
| `LLM_PROVIDER` | optional | `anthropic` (Default) oder `openrouter`. Ohne Angabe: OpenRouter, falls nur dessen Key gesetzt ist, sonst Anthropic. |
| `ANTHROPIC_API_KEY` | M1/M3/M5 (Anthropic) | Key von [console.anthropic.com](https://console.anthropic.com/) → *API Keys*. |
| `ANTHROPIC_MODEL` | optional | Default `claude-opus-4-8`; günstiger: `claude-sonnet-4-6`. |
| `OPENROUTER_API_KEY` | M1/M3/M5 (OpenRouter) | Key von [openrouter.ai/keys](https://openrouter.ai/keys). |
| `OPENROUTER_MODEL` | optional | Modell-Slug. **M1 braucht ein Vision-Modell**, z. B. `qwen/qwen-2.5-vl-72b-instruct`. Textmodelle wie `deepseek/deepseek-chat` reichen für M3/M5. |
| `REPLICATE_API_TOKEN` | M2 | Token von [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens). |
| `REPLICATE_WORNLOOK_MODEL` | optional | Bild-Modell-Slug. Default `black-forest-labs/flux-kontext-pro`. |

**Minimalstart:** Einen LLM-Key setzen (`ANTHROPIC_API_KEY` **oder** `OPENROUTER_API_KEY`)
– dann funktionieren KI-Listing (M1), Preisrechner (M3), Finanzübersicht (M4) und
Produktfindung (M5). M2 zeigt einen Hinweis, solange Replicate nicht konfiguriert ist.

> **OpenRouter & günstige (chinesische) Modelle:** Setze `OPENROUTER_API_KEY` und
> `OPENROUTER_MODEL`. Für M3/M5 (nur Text) eignen sich z. B. `deepseek/deepseek-chat` oder
> `qwen/qwen-2.5-72b-instruct`. Für **M1** muss das Modell **Bilder verstehen** – nutze ein
> Vision-Modell wie `qwen/qwen-2.5-vl-72b-instruct`, sonst schlägt die Foto-Analyse fehl.

> Hinweis zu M2: Das Image-Edit-Modell (FLUX Kontext) rendert das Kleidungsstück direkt aus
> dem Flat-Lay „getragen" – es ist **kein** Modellfoto nötig.

### 5. Entwicklungsserver starten

```bash
npm run dev
```

App öffnen: **http://localhost:3000**

- `/` – KI-Listing aus Foto (M1) + Getragen-Look (M2)
- `/preise` – Preisrechner (M3)
- `/finanzen` – Finanzübersicht (M4)
- `/finden` – Produktfindung / Deal-Bewertung (M5)

### 6. Produktion

```bash
npm run build    # optimierten Build erzeugen
npm run start    # Produktionsserver (Default: Port 3000)
```

Für dauerhaften Betrieb auf einem eigenen Server (pm2, nginx, HTTPS) siehe
**[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

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
| `app/finden/page.tsx` | Produktfindung / Deal-Bewertung (M5) |
| `app/components/` | Nav, WornLook |
| `app/api/listing/route.ts` | Foto → KI-Listing |
| `app/api/price/route.ts` | Merkmale → Preisvorschlag |
| `app/api/worn-look/route.ts` | Flat-Lay → Getragen-Look-Bild |
| `app/api/items/...` | Inventar (CRUD) + Verkauf melden |
| `app/api/deals/evaluate/route.ts` | Kandidaten → Deal-Bewertung |
| `lib/llm.ts` | LLM-Abstraktion: Anthropic **oder** OpenRouter (JSON-Ausgabe) |
| `lib/listing.ts` | M1: Vision-LLM → Listing-JSON |
| `lib/pricing.ts` | M3: `PriceProvider` (LLM-Schätzung) |
| `lib/imagegen.ts` | M2: `ImageProvider` (Replicate Image-Edit) |
| `lib/store.ts` | M4: datei-basierter Store (`.data/store.json`) |
| `lib/finance.ts` | M4: Kennzahlen-Berechnung |
| `lib/deals.ts` | M5: Deal-Bewertung gegen M3-Marktpreis |
| `extension/` | Browser-Erweiterung (Listing-Copy-Helfer) – siehe `extension/README.md` |
| `docs/KONZEPT.md` | Produkt- & Architektur-Konzept |

---

## Zugriffsschutz (für Deployments)

Solange `APP_API_KEY` **nicht** gesetzt ist (lokale Entwicklung), sind alle Routen offen.
Wird die App deployt, sollte `APP_API_KEY` gesetzt werden – dann verlangen die KI-Routen
(`/api/listing`, `/api/price`, `/api/worn-look`, `/api/deals/evaluate`) den Header
`x-app-key`. So kann nicht jeder dein Deployment nutzen und deine LLM-/Replicate-Credits
verbrauchen.

- **Web-UI:** Key einmalig über das 🔑-Feld oben rechts eingeben (im Browser gespeichert,
  nicht im Bundle enthalten).
- **Erweiterung:** Key in den Einstellungen (⚙︎) hinterlegen.

> Der `APP_API_KEY` ist ein **gemeinsames Geheimnis**, das du an berechtigte Nutzer
> weitergibst. Für echte Mehrbenutzer-Trennung wäre später ein Login-System (Auth) der
> nächste Schritt.

---

## Browser-Erweiterung (Listing-Copy-Helfer)

Im Ordner `extension/` liegt eine schlanke MV3-Erweiterung (Chrome/Edge/Firefox): Foto im
Popup wählen → die laufende VintageApp generiert das Listing → Felder mit Kopier-Buttons.
Bewusst **ohne** automatisches Ausfüllen von Vinted (AGB-neutral). Installation per
„Entpackte Erweiterung laden" – Details in [`extension/README.md`](extension/README.md).

---

## Datenhaltung

Für den MVP nutzt M4 einen **datei-basierten Store** unter `.data/store.json` (per
`.gitignore` ausgeschlossen). Die Logik ist hinter `lib/store.ts` gekapselt – der Wechsel
auf PostgreSQL/Prisma (Konzept-Ziel) betrifft nur diese Datei.

---

## Rechtlicher Hinweis zur Produktfindung (M5)

M5 enthält bewusst **keinen** automatischen Vinted-Crawler. Automatisiertes Scraping bzw.
die Nutzung der privaten Vinted-API berührt die Vinted-AGB und ist erst nach rechtlicher
Bewertung zulässig (siehe `docs/KONZEPT.md` §5). Die mitgelieferte Bewertungs-Engine
arbeitet ausschließlich mit **manuell eingegebenen** Kandidaten. Eine AGB-konforme
Datenquelle kann später über das `DealSource`-Interface (`lib/deals.ts`) ergänzt werden.

---

## Fehlersuche

| Symptom | Ursache / Lösung |
|---------|------------------|
| `… API_KEY ist nicht gesetzt` | LLM-Key in `.env` eintragen (`ANTHROPIC_API_KEY` oder `OPENROUTER_API_KEY`), Server neu starten. |
| M1 (Foto) schlägt mit OpenRouter fehl | Gewähltes `OPENROUTER_MODEL` ist nicht vision-fähig → Vision-Modell wählen (z. B. `qwen/qwen-2.5-vl-72b-instruct`). |
| `Bild-KI nicht konfiguriert` (M2) | `REPLICATE_API_TOKEN` setzen. |
| M2 schlägt fehl / leeres Bild | Replicate-Modell ausgelastet, Guthaben aufgebraucht, oder Modell-Slug ungültig. |
| Port 3000 belegt | Anderen Port nutzen: `PORT=3100 npm run dev`. |
| Änderungen an `.env` greifen nicht | Server stoppen und neu starten (ENV wird beim Start gelesen). |
