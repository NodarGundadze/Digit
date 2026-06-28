"use client";

import { MapPin, Navigation } from "lucide-react";

interface Pt {
  lat: number;
  lng: number;
}

// A lightweight stylized "GPS" panel: plots the customer destination, the
// technician's current position, and the breadcrumb route between them.
export default function MapMockup({
  customer,
  route = [],
  tech,
  address,
  className = "h-48",
}: {
  customer: Pt;
  route?: Pt[];
  tech?: Pt | null;
  address?: string;
  className?: string;
}) {
  const all: Pt[] = [customer, ...route, ...(tech ? [tech] : [])];
  const lats = all.map((p) => p.lat);
  const lngs = all.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.01;
  const spanLng = maxLng - minLng || 0.01;
  minLat -= spanLat * 0.25;
  maxLat += spanLat * 0.25;
  minLng -= spanLng * 0.25;
  maxLng += spanLng * 0.25;

  const toXY = (p: Pt) => ({
    x: ((p.lng - minLng) / (maxLng - minLng)) * 100,
    y: (1 - (p.lat - minLat) / (maxLat - minLat)) * 100,
  });

  const cust = toXY(customer);
  const techPos = tech
    ? toXY(tech)
    : route.length
    ? toXY(route[route.length - 1])
    : { x: 10, y: 86 };
  const linePts = route.map(toXY);
  const polyline = [
    ...linePts,
    techPos,
  ]
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {route.length > 0 && (
          <polyline
            points={polyline}
            fill="none"
            stroke="#818cf8"
            strokeWidth="0.8"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Destination */}
      <Marker x={cust.x} y={cust.y} tone="text-rose-400">
        <MapPin className="w-5 h-5 drop-shadow" />
      </Marker>

      {/* Technician */}
      <Marker x={techPos.x} y={techPos.y} tone="text-indigo-300">
        <span className="relative flex items-center justify-center">
          <span className="absolute w-6 h-6 rounded-full bg-indigo-400/30 animate-ping" />
          <Navigation className="w-4 h-4" />
        </span>
      </Marker>

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-slate-300/80">
        <span className="truncate bg-slate-800/70 rounded px-1.5 py-0.5">
          {address || `${customer.lat.toFixed(4)}, ${customer.lng.toFixed(4)}`}
        </span>
        <span className="bg-slate-800/70 rounded px-1.5 py-0.5">
          {route.length} pts
        </span>
      </div>
    </div>
  );
}

function Marker({
  x,
  y,
  tone,
  children,
}: {
  x: number;
  y: number;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${tone}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
    </div>
  );
}
