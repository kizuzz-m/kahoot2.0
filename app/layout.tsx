import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quizwerk – Live-Quiz für alle Geräte",
  description: "Quizze erstellen, importieren und live mit Smartphones, Tablets und Computern spielen.",
};

export const viewport: Viewport = {
  themeColor: "#0c1424",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-dots">{children}</body>
    </html>
  );
}
