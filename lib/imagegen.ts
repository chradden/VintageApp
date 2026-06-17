// Modul M2 – Getragen-Look-Fotos. Hinter einem Provider-Interface, damit der
// Bild-KI-Anbieter austauschbar bleibt. Standard: Replicate Image-Edit
// (FLUX Kontext) – erzeugt aus dem Flat-Lay ein "getragen" aussehendes Bild,
// OHNE dass ein Modellfoto nötig ist.

export interface WornLookInput {
  /** Flat-Lay des Kleidungsstücks als Data-URI (data:image/...;base64,...). */
  garmentDataUri: string;
  /** Kurze Beschreibung des Kleidungsstücks (verbessert das Ergebnis). */
  description?: string;
}

export interface WornLookResult {
  imageUrl: string;
  provider: string;
}

export interface ImageProvider {
  generateWornLook(input: WornLookInput): Promise<WornLookResult>;
}

const REPLICATE_API = "https://api.replicate.com/v1";

function buildPrompt(description?: string): string {
  const item = description?.trim() ? description.trim() : "dieses Kleidungsstück";
  return [
    `Realistic e-commerce photo of ${item} being worn by a person,`,
    "natural studio lighting, clean neutral background, full or upper body as appropriate.",
    "Keep the garment's exact color, pattern, fabric and details unchanged.",
  ].join(" ");
}

/**
 * Replicate-basierter Provider (Image-Edit, Default FLUX Kontext).
 *
 * Benötigt:
 *  - REPLICATE_API_TOKEN: API-Token von replicate.com
 *  - REPLICATE_WORNLOOK_MODEL (optional): Modell-Slug,
 *    Default "black-forest-labs/flux-kontext-pro".
 *
 * Es ist KEIN Modellfoto nötig – das Modell rendert das Kleidungsstück
 * "getragen" direkt aus dem Flat-Lay.
 */
export class ReplicateWornLookProvider implements ImageProvider {
  constructor(
    private token: string,
    private model = process.env.REPLICATE_WORNLOOK_MODEL ??
      "black-forest-labs/flux-kontext-pro",
  ) {}

  async generateWornLook(input: WornLookInput): Promise<WornLookResult> {
    const start = await fetch(`${REPLICATE_API}/models/${this.model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        // Blockiert bis zu 60s auf das Ergebnis, sonst pollen wir nach.
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          prompt: buildPrompt(input.description),
          input_image: input.garmentDataUri,
          output_format: "jpg",
        },
      }),
    });

    let pred = (await start.json()) as ReplicatePrediction;
    if (!start.ok) {
      throw new Error(pred?.detail ?? "Fehler bei der Replicate-Anfrage.");
    }

    const getUrl = pred.urls?.get;
    let tries = 0;
    while (
      getUrl &&
      pred.status !== "succeeded" &&
      pred.status !== "failed" &&
      pred.status !== "canceled" &&
      tries < 30
    ) {
      await sleep(2000);
      const r = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      pred = (await r.json()) as ReplicatePrediction;
      tries++;
    }

    if (pred.status !== "succeeded") {
      throw new Error(pred.error ?? "Bildgenerierung fehlgeschlagen.");
    }

    const imageUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    if (!imageUrl) throw new Error("Keine Bild-URL im Ergebnis.");

    return { imageUrl, provider: "Replicate · FLUX Kontext" };
  }
}

interface ReplicatePrediction {
  status?: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  detail?: string;
  urls?: { get?: string };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Liefert den konfigurierten Provider oder null, wenn REPLICATE_API_TOKEN fehlt
 * (dann gibt die Route eine hilfreiche Meldung zurück).
 */
export function resolveImageProvider(): ImageProvider | null {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  return new ReplicateWornLookProvider(token);
}
