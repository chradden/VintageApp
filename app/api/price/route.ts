import { NextRequest, NextResponse } from "next/server";
import { getPriceSuggestion, type PriceInput } from "@/lib/pricing";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY ist nicht gesetzt (siehe .env.example)." },
      { status: 500 },
    );
  }

  let body: Partial<PriceInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  if (!body.marke || !body.kategorie || !body.zustand) {
    return NextResponse.json(
      { error: "marke, kategorie und zustand sind erforderlich." },
      { status: 400 },
    );
  }

  try {
    const suggestion = await getPriceSuggestion(body as PriceInput);
    return NextResponse.json({ suggestion });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
