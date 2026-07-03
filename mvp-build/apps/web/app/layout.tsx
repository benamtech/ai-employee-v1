import type { ReactNode } from "react";

export const metadata = {
  title: "AMTECH AI Employee",
  description: "A textable AI employee for your business.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
