import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Analyzer",
  description:
    "A free, no-login resume analyzer that runs locally in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-950">{children}</body>
    </html>
  );
}
