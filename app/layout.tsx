import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boss Beauty Studio",
  description:
    "L'assistant marketing automatisé pour les professionnelles de la beauté.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
      >
        {children}
      </body>
    </html>
  );
}
