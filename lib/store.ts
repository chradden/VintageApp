import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Einfacher datei-basierter Store für den MVP (Modul M4). Bewusst hinter einer
// schmalen Repository-API gekapselt, damit der spätere Wechsel auf
// Postgres/Prisma (Konzept-Ziel) nur diese Datei betrifft.
const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

export type ItemStatus = "verfuegbar" | "verkauft";

export interface Item {
  id: string;
  titel: string;
  marke: string;
  kategorie: string;
  groesse: string;
  zustand: string;
  einkaufspreisEur: number;
  status: ItemStatus;
  erstelltAm: string; // ISO
}

export interface Transaction {
  id: string;
  itemId: string;
  verkaufspreisEur: number;
  gebuehrenEur: number;
  versandEur: number;
  datum: string; // ISO
}

interface StoreData {
  items: Item[];
  transactions: Transaction[];
}

async function read(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    return JSON.parse(raw) as StoreData;
  } catch {
    return { items: [], transactions: [] };
  }
}

async function write(data: StoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function listItems(): Promise<Item[]> {
  return (await read()).items;
}

export async function listTransactions(): Promise<Transaction[]> {
  return (await read()).transactions;
}

export async function getSnapshot(): Promise<StoreData> {
  return read();
}

export interface NewItem {
  titel: string;
  marke: string;
  kategorie: string;
  groesse: string;
  zustand: string;
  einkaufspreisEur: number;
}

export async function createItem(input: NewItem): Promise<Item> {
  const data = await read();
  const item: Item = {
    id: randomUUID(),
    status: "verfuegbar",
    erstelltAm: new Date().toISOString(),
    ...input,
  };
  data.items.push(item);
  await write(data);
  return item;
}

export interface SaleInput {
  verkaufspreisEur: number;
  gebuehrenEur: number;
  versandEur: number;
}

/** Markiert einen Artikel als verkauft und legt die zugehörige Transaktion an. */
export async function markSold(
  itemId: string,
  sale: SaleInput,
): Promise<Transaction> {
  const data = await read();
  const item = data.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Artikel nicht gefunden.");
  if (item.status === "verkauft") throw new Error("Artikel ist bereits verkauft.");

  item.status = "verkauft";
  const tx: Transaction = {
    id: randomUUID(),
    itemId,
    datum: new Date().toISOString(),
    ...sale,
  };
  data.transactions.push(tx);
  await write(data);
  return tx;
}
