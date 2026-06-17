// Modul M2 – Getragen-Look-Fotos. Wie bei M3 hinter einem Provider-Interface,
// damit der Bild-KI-Anbieter austauschbar bleibt. Standard: Replicate Virtual
// Try-On (IDM-VTON), das ein Kleidungsstück auf ein Modell-Foto "anzieht".

export interface WornLookInput {
  /** Flat-Lay des Kleidungsstücks als Data-URI (data:image/...;base64,...). */
  garmentDataUri: string;
  /** Kurze Beschreibung des Kleidungsstücks (verbessert das Ergebnis). */
  description?: string;
  /** Körperregion für das Try-On-Modell. */
  category?: "upper_body" | "lower_body" | "dresses";
}

export interface WornLookResult {
  imageUrl: string;
  provider: string;
}

export interface ImageProvider {
  generateWornLook(input: WornLookInput): Promise<WornLookResult>;
}

const REPLICATE_API = "https://api.replicate.com/v1";

/**
 * Replicate-basierter Virtual-Try-On-Provider.
 *
 * Benötigt:
 *  - REPLICATE_API_TOKEN: API-Token von replicate.com
 *  - TRYON_MODEL_IMAGE_URL: öffentlich erreichbares Foto einer Person/eines Modells,
 *    auf das das Kleidungsstück projiziert wird (IDM-VTON braucht ein Personenbild).
 *  - REPLICATE_TRYON_MODEL (optional): Modell-Slug, Default "cuuupid/idm-vton".
 */
export class ReplicateTryOnProvider implements ImageProvider {
  constructor(
    private token: string,
    private modelImageUrl: string,
    private model = process.env.REPLICATE_TRYON_MODEL ?? "cuuupid/idm-vton",
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
          human_img: this.modelImageUrl,
          garm_img: input.garmentDataUri,
          garment_des: input.description ?? "Kleidungsstück",
          category: input.category ?? "upper_body",
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

    return { imageUrl, provider: "Replicate · Virtual Try-On" };
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
 * Liefert den konfigurierten Provider oder null, wenn die nötigen ENV-Variablen
 * fehlen (dann gibt die Route eine hilfreiche Meldung zurück).
 */
export function resolveImageProvider(): ImageProvider | null {
  const token = process.env.REPLICATE_API_TOKEN;
  const modelImageUrl = process.env.TRYON_MODEL_IMAGE_URL;
  if (!token || !modelImageUrl) return null;
  return new ReplicateTryOnProvider(token, modelImageUrl);
}
