import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "GeneScope AI | Interactive Transcriptomic Biomarker Discovery Platform",
  description:
    "Comparative gene expression analysis of cancer progression and sarcoma subtypes using differential expression, pathway analysis, and machine learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
