import { NextRequest, NextResponse } from "next/server";
import { resolveImageProvider } from "@/lib/imagegen";
import { requireApiKey } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const provider = resolveImageProvider();
  if (!provider) {
    return NextResponse.json(
      {
        error:
          "Bild-KI nicht konfiguriert. Bitte REPLICATE_API_TOKEN setzen (siehe README / .env.example).",
      },
      { status: 503 },
    );
  }

  let body: { imageBase64?: string; mediaType?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const { imageBase64, mediaType, description } = body;
  if (!imageBase64 || !mediaType) {
    return NextResponse.json(
      { error: "imageBase64 und mediaType sind erforderlich." },
      { status: 400 },
    );
  }

  try {
    const result = await provider.generateWornLook({
      garmentDataUri: `data:${mediaType};base64,${imageBase64}`,
      description,
    });
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
