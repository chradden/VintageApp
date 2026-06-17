import { NextRequest, NextResponse } from "next/server";
import { evaluateDeals, type DealCandidate } from "@/lib/deals";
import { isLlmConfigured, missingKeyMessage } from "@/lib/llm";
import { requireApiKey } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  if (!isLlmConfigured()) {
    return NextResponse.json({ error: missingKeyMessage() }, { status: 500 });
  }

  let body: { candidates?: DealCandidate[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const candidates = body.candidates ?? [];
  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "Mindestens ein Kandidat ist erforderlich." },
      { status: 400 },
    );
  }
  const invalid = candidates.find(
    (c) => !c.marke || !c.kategorie || !c.zustand || !(c.angebotspreisEur >= 0),
  );
  if (invalid) {
    return NextResponse.json(
      { error: "Jeder Kandidat braucht marke, kategorie, zustand und angebotspreisEur." },
      { status: 400 },
    );
  }

  try {
    const deals = await evaluateDeals(candidates);
    return NextResponse.json({ deals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
