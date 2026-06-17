import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

// Modul M3 – Preisvorschläge. Bewusst hinter einem Provider-Interface, damit
// später ein echter Vinted-Vergleichsdaten-Provider eingesteckt werden kann
// (offene rechtliche Frage, siehe docs/KONZEPT.md §5/§8). Aktuell schätzt ein
// LLM den Marktpreis aus den Artikelmerkmalen.
export interface PriceInput {
  marke: string;
  kategorie: string;
  zustand: string;
  groesse?: string;
  beschreibung?: string;
}

export type Konfidenz = "niedrig" | "mittel" | "hoch";

export interface PriceSuggestion {
  empfohlenEur: number;
  minEur: number;
  maxEur: number;
  konfidenz: Konfidenz;
  begruendung: string;
  quelle: string;
}

export interface PriceProvider {
  suggest(input: PriceInput): Promise<PriceSuggestion>;
}

const PRICE_SCHEMA = {
  type: "object",
  properties: {
    empfohlen_eur: { type: "number" },
    min_eur: { type: "number" },
    max_eur: { type: "number" },
    konfidenz: { type: "string", enum: ["niedrig", "mittel", "hoch"] },
    begruendung: { type: "string" },
  },
  required: ["empfohlen_eur", "min_eur", "max_eur", "konfidenz", "begruendung"],
  additionalProperties: false,
} as const;

/** LLM-basierter Preis-Provider (Standard bis echte Vergleichsdaten verfügbar sind). */
export class LlmPriceProvider implements PriceProvider {
  async suggest(input: PriceInput): Promise<PriceSuggestion> {
    const client = new Anthropic();

    const merkmale = [
      `Marke: ${input.marke}`,
      `Kategorie: ${input.kategorie}`,
      `Zustand: ${input.zustand}`,
      input.groesse ? `Größe: ${input.groesse}` : null,
      input.beschreibung ? `Beschreibung: ${input.beschreibung}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.beta.messages.create({
      betas: ["structured-outputs-2025-11-13"],
      model: MODEL,
      max_tokens: 800,
      system: `Du schätzt realistische Verkaufspreise für Second-Hand-Mode auf dem deutschen Vinted-Markt.
Gib eine empfohlene Preisspanne in EUR zurück. Bewerte die Konfidenz deiner Schätzung:
"hoch" bei bekannter Marke mit stabilem Wiederverkaufswert, "niedrig" bei unbekannter Marke
oder dünner Datenlage. Dies ist eine Schätzung ohne Live-Vergleichsdaten – weise in der
Begründung kurz darauf hin.`,
      output_format: {
        type: "json_schema",
        schema: PRICE_SCHEMA as unknown as Record<string, unknown>,
      },
      messages: [
        {
          role: "user",
          content: `Schätze den Vinted-Verkaufspreis für diesen Artikel:\n${merkmale}`,
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

    const raw = JSON.parse(textBlock.text) as {
      empfohlen_eur: number;
      min_eur: number;
      max_eur: number;
      konfidenz: Konfidenz;
      begruendung: string;
    };

    return {
      empfohlenEur: raw.empfohlen_eur,
      minEur: raw.min_eur,
      maxEur: raw.max_eur,
      konfidenz: raw.konfidenz,
      begruendung: raw.begruendung,
      quelle: "KI-Schätzung",
    };
  }
}

const defaultProvider: PriceProvider = new LlmPriceProvider();

export function getPriceSuggestion(input: PriceInput): Promise<PriceSuggestion> {
  return defaultProvider.suggest(input);
}
