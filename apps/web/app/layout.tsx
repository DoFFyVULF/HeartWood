import type { Metadata } from "next";
import { Caveat, Nunito } from "next/font/google";
import "./globals.css";

// Round, friendly typeface that reads well in Russian (has a full cyrillic subset).
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Handwritten typeface for love letters — full cyrillic, reads like a real pen.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Heartwood — ваш мир отношений",
  description:
    "Живой мир для вашей пары: свидания, купоны, воспоминания и сюрпризы, которые растут вместе с вами.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
