import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Einheitlicher LLM-Zugang für strukturierte JSON-Ausgaben (M1, M3, M5).
// Unterstützt zwei Anbieter, per ENV umschaltbar:
//   - "anthropic"  (Default): Claude über das Anthropic-SDK
//   - "openrouter": beliebige OpenAI-kompatible Modelle über OpenRouter
//     (inkl. günstiger Modelle wie DeepSeek, Qwen, GLM …)

export type LlmProvider = "anthropic" | "openrouter";

export interface LlmImage {
  base64: string;
  mediaType: string;
}

export interface JsonRequest {
  system: string;
  userText: string;
  schema: Record<string, unknown>;
  schemaName?: string;
  image?: LlmImage; // nur von vision-fähigen Modellen unterstützt (M1!)
  maxTokens?: number;
}

export function activeProvider(): LlmProvider {
  const explicit = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  if (explicit === "openrouter") return "openrouter";
  if (explicit === "anthropic") return "anthropic";
  // Auto: OpenRouter nur, wenn dessen Key gesetzt ist und kein Anthropic-Key.
  if (process.env.OPENROUTER_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return "openrouter";
  }
  return "anthropic";
}

/** True, wenn der aktive Anbieter einen API-Key besitzt. */
export function isLlmConfigured(): boolean {
  return activeProvider() === "openrouter"
    ? !!process.env.OPENROUTER_API_KEY
    : !!process.env.ANTHROPIC_API_KEY;
}

/** Hilfreiche Fehlermeldung, welcher Key fehlt. */
export function missingKeyMessage(): string {
  return activeProvider() === "openrouter"
    ? "OPENROUTER_API_KEY ist nicht gesetzt (siehe .env.example)."
    : "ANTHROPIC_API_KEY ist nicht gesetzt (siehe .env.example).";
}

export async function generateJson<T>(req: JsonRequest): Promise<T> {
  return activeProvider() === "openrouter"
    ? viaOpenRouter<T>(req)
    : viaAnthropic<T>(req);
}

// --- Anthropic (Claude) ---------------------------------------------------

async function viaAnthropic<T>(req: JsonRequest): Promise<T> {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";
  const client = new Anthropic();

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (req.image) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: req.image.mediaType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: req.image.base64,
      },
    });
  }
  content.push({ type: "text", text: req.userText });

  const response = await client.beta.messages.create({
    betas: ["structured-outputs-2025-11-13"],
    model,
    max_tokens: req.maxTokens ?? 2000,
    system: req.system,
    output_format: { type: "json_schema", schema: req.schema },
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Die Anfrage wurde aus Sicherheitsgründen abgelehnt.");
  }
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Keine verwertbare Antwort vom Modell erhalten.");
  }
  return parseJson<T>(textBlock.text);
}

// --- OpenRouter (OpenAI-kompatibel) ---------------------------------------

async function viaOpenRouter<T>(req: JsonRequest): Promise<T> {
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  if (req.image) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${req.image.mediaType};base64,${req.image.base64}` },
    });
  }
  // Schema in den Prompt, damit auch Modelle ohne json_schema-Unterstützung
  // die richtige Struktur liefern.
  parts.push({
    type: "text",
    text:
      req.userText +
      "\n\nAntworte AUSSCHLIESSLICH mit gültigem JSON nach diesem Schema " +
      "(keine Erklärung, kein Markdown):\n" +
      JSON.stringify(req.schema),
  });

  const response = await client.chat.completions.create({
    model,
    max_tokens: req.maxTokens ?? 2000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: parts },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return parseJson<T>(text);
}

// --- Robustes JSON-Parsing ------------------------------------------------

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fallback: erstes {...}-Objekt aus der Antwort extrahieren.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    throw new Error("Antwort des Modells war kein gültiges JSON.");
  }
}
