import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoorTiles",
  description: "NoorTiles is a colorful piano tiles game with nasheeds.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
