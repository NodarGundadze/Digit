import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Gantari, Space_Mono } from "next/font/google";
import { getBranding } from "@/lib/settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brand fonts for the auth screens (imported from the Dig-IT Auth design).
const gantari = Gantari({
  variable: "--font-gantari",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { brandName } = await getBranding();
  return {
    title: `${brandName} — IT Operations Marketplace`,
    description:
      "Customers file IT outages, managers triage and broadcast, vetted specialists resolve them in real time.",
  };
}

// Derive the indigo scale from a single admin-chosen primary so every
// `*-indigo-*` utility recolors at once. `null` -> use the @theme defaults.
function brandVars(primary: string | null): CSSProperties | undefined {
  if (!primary) return undefined;
  const mix = (pct: number, towards: "white" | "black") =>
    `color-mix(in srgb, ${primary} ${pct}%, ${towards})`;
  return {
    "--brand-50": mix(8, "white"),
    "--brand-100": mix(16, "white"),
    "--brand-200": mix(28, "white"),
    "--brand-300": mix(45, "white"),
    "--brand-400": mix(70, "white"),
    "--brand-500": mix(88, "white"),
    "--brand-600": primary,
    "--brand-700": mix(82, "black"),
  } as CSSProperties;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { primary } = await getBranding();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${gantari.variable} ${spaceMono.variable} h-full antialiased`}
      style={brandVars(primary)}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
