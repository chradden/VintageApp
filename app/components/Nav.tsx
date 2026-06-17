import Link from "next/link";

export default function Nav() {
  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-bold tracking-tight">
          VintageApp
        </Link>
        <div className="flex gap-4 text-sm text-neutral-600">
          <Link href="/" className="hover:text-neutral-900">
            KI-Listing
          </Link>
          <Link href="/preise" className="hover:text-neutral-900">
            Preisrechner
          </Link>
          <Link href="/finanzen" className="hover:text-neutral-900">
            Finanzen
          </Link>
          <Link href="/finden" className="hover:text-neutral-900">
            Produktfindung
          </Link>
        </div>
      </div>
    </nav>
  );
}
