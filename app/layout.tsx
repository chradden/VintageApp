import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "VintageApp – KI-Listing für Vinted",
  description:
    "Foto hochladen, KI erstellt Titel, Beschreibung, Details und Preisvorschlag für Vinted.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
