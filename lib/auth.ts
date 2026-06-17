import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Optionaler Zugriffsschutz für die KI-Routen.
// - Ist APP_API_KEY NICHT gesetzt (lokale Entwicklung), sind die Routen offen.
// - Ist APP_API_KEY gesetzt (z. B. im Deployment), muss der Aufrufer den Key
//   per Header "x-app-key" (oder "Authorization: Bearer <key>") mitsenden.
export function requireApiKey(req: NextRequest): NextResponse | null {
  const required = process.env.APP_API_KEY;
  if (!required) return null;

  const provided =
    req.headers.get("x-app-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (provided && safeEqual(provided, required)) return null;

  return NextResponse.json(
    { error: "Nicht autorisiert. Gültigen API-Key senden (Header x-app-key)." },
    { status: 401 },
  );
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
