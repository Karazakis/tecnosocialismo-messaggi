import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Messaggi | Tecnosocialismo",
  description: "Conversazioni dirette e di gruppo nell’ecosistema Tecnosocialismo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body>{children}</body></html>;
}
