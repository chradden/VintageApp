# VintageApp – Browser-Erweiterung (Listing-Helfer)

Ein schlanker **Copy-Helfer**: Foto im Popup auswählen → die laufende VintageApp
generiert das Listing (M1) → Titel, Beschreibung, Details und Preisvorschlag werden mit
**Kopier-Buttons** angezeigt. Du fügst die Felder dann selbst in Vinted ein.

> Bewusst **kein** automatisches Ausfüllen von Vinted – damit AGB-neutral.

## Installation (Chrome/Edge, „unpacked")

1. VintageApp lokal starten: `npm run dev` (läuft auf `http://localhost:3000`).
2. Browser öffnen → `chrome://extensions` (bzw. `edge://extensions`).
3. **Entwicklermodus** oben rechts aktivieren.
4. **„Entpackte Erweiterung laden"** → diesen Ordner (`extension/`) auswählen.
5. Das VintageApp-Icon in der Toolbar anklicken → Popup öffnet sich.

## Nutzung

1. Über das Zahnrad ⚙︎ ggf. die **Backend-URL** anpassen (Standard `http://localhost:3000`)
   und – falls das Backend mit `APP_API_KEY` geschützt ist – den **API-Key** eintragen.
2. Produktfoto auswählen → **„Listing generieren"**.
3. Felder per **„Kopieren"** übernehmen und in Vinted einfügen.

## Hinweise

- Die Erweiterung braucht eine laufende, erreichbare VintageApp-Instanz (lokal oder
  deployed). Der LLM-API-Key bleibt **serverseitig** – die Erweiterung kennt ihn nicht.
- Firefox: MV3 wird unterstützt; ggf. über `about:debugging` → „Dieses Firefox" →
  „Temporäre Erweiterung laden" die `manifest.json` wählen.
- Für eine öffentlich deployte Backend-Instanz solltest du eine Zugriffskontrolle
  (API-Key/Auth) ergänzen – aktuell ist `/api/listing` ungeschützt.
