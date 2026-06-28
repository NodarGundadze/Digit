import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { roleHome, type Role } from "@/lib/types";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Dig-IT — IT outages, resolved in real time",
  description:
    "File an IT outage, get a transparent quote, and watch a vetted specialist resolve it in real time. Welcome to Dig-IT.",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role as Role));

  return <LandingPage />;
}
