import { NextRequest, NextResponse } from "next/server";
import { generateListing, type ListingMediaType } from "@/lib/listing";
import { isLlmConfigured, missingKeyMessage } from "@/lib/llm";
import { requireApiKey } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPPORTED: ListingMediaType[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  if (!isLlmConfigured()) {
    return NextResponse.json({ error: missingKeyMessage() }, { status: 500 });
  }

  let body: { imageBase64?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const { imageBase64, mediaType } = body;
  if (!imageBase64 || !mediaType) {
    return NextResponse.json(
      { error: "imageBase64 und mediaType sind erforderlich." },
      { status: 400 },
    );
  }
  if (!SUPPORTED.includes(mediaType as ListingMediaType)) {
    return NextResponse.json(
      { error: `Nicht unterstütztes Bildformat: ${mediaType}` },
      { status: 400 },
    );
  }

  try {
    const listing = await generateListing(imageBase64, mediaType as ListingMediaType);
    return NextResponse.json({ listing });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
