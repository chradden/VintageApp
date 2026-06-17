import { NextRequest, NextResponse } from "next/server";
import { markSold, type SaleInput } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Partial<SaleInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  try {
    const tx = await markSold(id, {
      verkaufspreisEur: Number(body.verkaufspreisEur) || 0,
      gebuehrenEur: Number(body.gebuehrenEur) || 0,
      versandEur: Number(body.versandEur) || 0,
    });
    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
