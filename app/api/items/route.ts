import { NextRequest, NextResponse } from "next/server";
import { createItem, getSnapshot, type NewItem } from "@/lib/store";
import { computeMetrics } from "@/lib/finance";

export const runtime = "nodejs";

export async function GET() {
  const { items, transactions } = await getSnapshot();
  const metrics = computeMetrics(items, transactions);
  return NextResponse.json({ items, transactions, metrics });
}

export async function POST(req: NextRequest) {
  let body: Partial<NewItem>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  if (!body.titel) {
    return NextResponse.json({ error: "titel ist erforderlich." }, { status: 400 });
  }

  const item = await createItem({
    titel: body.titel,
    marke: body.marke ?? "Unbekannt",
    kategorie: body.kategorie ?? "",
    groesse: body.groesse ?? "",
    zustand: body.zustand ?? "",
    einkaufspreisEur: Number(body.einkaufspreisEur) || 0,
  });

  return NextResponse.json({ item }, { status: 201 });
}
