import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBranding } from "@/lib/settings";
import { roleHome, type Role } from "@/lib/types";
import LandingPage from "@/components/landing/LandingPage";

export async function generateMetadata(): Promise<Metadata> {
  const { brandName } = await getBranding();
  return {
    title: `${brandName} — IT outages, resolved in real time`,
    description: `File an IT outage, get a transparent quote, and watch a vetted specialist resolve it in real time. Welcome to ${brandName}.`,
  };
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role as Role));

  const { logoUrl, brandName } = await getBranding();
  return <LandingPage logoUrl={logoUrl} brandName={brandName} />;
}
