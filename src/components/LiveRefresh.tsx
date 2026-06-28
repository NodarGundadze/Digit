"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polls the server by re-running the route's server components, giving the
// dashboards near-real-time updates across roles/tabs without a separate API.
export default function LiveRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
