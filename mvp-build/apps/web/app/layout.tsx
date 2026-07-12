import type { ReactNode } from "react";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='#e11d2a'/><text x='12' y='17' text-anchor='middle' font-family='Arial, sans-serif' font-size='15' font-weight='700' fill='#ffffff'>A</text></svg>",
  );

export const metadata = {
  title: "AMTECH — AI Employee",
  description: "A trusted AI employee for your business. It prepares the work, asks before anything leaves the business, and leaves proof.",
  icons: { icon: FAVICON },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
