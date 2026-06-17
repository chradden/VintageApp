import Anthropic from "@anthropic-ai/sdk";

// Default-Modell laut Konzept: aktuelles Claude-Modell mit Vision.
// Über ANTHROPIC_MODEL überschreibbar (z. B. claude-sonnet-4-6 für geringere Kosten).
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

export type ListingMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

// Struktur, die die KI aus einem Produktfoto erzeugt (Modul M1).
export interface Listing {
  titel: string;
  beschreibung: string;
  marke: string;
  groesse: string;
  kategorie: string;
  zustand: string;
  farbe: string;
  material: string;
  hashtags: string[];
  // Grobe Preisempfehlung (vereinfachtes M3 — ohne echte Vinted-Vergleichsdaten).
  preisvorschlag: {
    empfohlen_eur: number;
    min_eur: number;
    max_eur: number;
    begruendung: string;
  };
}

// JSON-Schema für die strukturierte Ausgabe (output_config.format).
// Bewusst ohne nicht unterstützte Constraints (minLength, minimum, ...).
const LISTING_SCHEMA = {
  type: "object",
  properties: {
    titel: { type: "string" },
    beschreibung: { type: "string" },
    marke: { type: "string" },
    groesse: { type: "string" },
    kategorie: { type: "string" },
    zustand: { type: "string" },
    farbe: { type: "string" },
    material: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    preisvorschlag: {
      type: "object",
      properties: {
        empfohlen_eur: { type: "number" },
        min_eur: { type: "number" },
        max_eur: { type: "number" },
        begruendung: { type: "string" },
      },
      required: ["empfohlen_eur", "min_eur", "max_eur", "begruendung"],
      additionalProperties: false,
    },
  },
  required: [
    "titel",
    "beschreibung",
    "marke",
    "groesse",
    "kategorie",
    "zustand",
    "farbe",
    "material",
    "hashtags",
    "preisvorschlag",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Du bist Experte für den Wiederverkauf von Vintage- und Second-Hand-Mode auf Vinted.
Analysiere das Produktfoto und erzeuge ein verkaufsfertiges Vinted-Listing auf Deutsch.

Richtlinien:
- Titel: prägnant, suchfreundlich, max. ~60 Zeichen (Marke + Artikel + Stil).
- Beschreibung: freundlicher Community-Ton, 2-4 Sätze, erwähnt erkennbare Details.
- Marke: nur wenn klar erkennbar, sonst "Unbekannt".
- Größe: erkennbare Größe (z. B. "M", "38"), sonst "Keine Angabe".
- Zustand: einer von "Neu mit Etikett", "Neuwertig", "Sehr gut", "Gut", "Akzeptabel".
- hashtags: 5-8 relevante Tags ohne #-Zeichen.
- preisvorschlag: realistische EUR-Schätzung für den deutschen Vinted-Markt. Dies ist
  eine grobe Schätzung ohne Live-Vergleichsdaten; weise in der Begründung kurz darauf hin.
Wenn ein Detail nicht erkennbar ist, triff eine plausible Annahme statt zu raten.`;

/**
 * Erzeugt aus einem Produktfoto ein strukturiertes Vinted-Listing (Modul M1).
 */
export async function generateListing(
  imageBase64: string,
  mediaType: ListingMediaType,
): Promise<Listing> {
  const client = new Anthropic();

  const response = await client.beta.messages.create({
    betas: ["structured-outputs-2025-11-13"],
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    output_format: {
      type: "json_schema",
      schema: LISTING_SCHEMA as unknown as Record<string, unknown>,
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Erstelle das vollständige Vinted-Listing für dieses Kleidungsstück.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Die Anfrage wurde aus Sicherheitsgründen abgelehnt.");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Keine verwertbare Antwort vom Modell erhalten.");
  }

  return JSON.parse(textBlock.text) as Listing;
}
