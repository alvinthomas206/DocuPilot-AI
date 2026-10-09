import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocuPilot AI — Project Documentation Assistant",
  description: "Turn project descriptions and source code into structured documentation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
