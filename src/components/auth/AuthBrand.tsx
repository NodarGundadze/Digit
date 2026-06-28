import { Wrench } from "lucide-react";
import { ACCENT_GRADIENT, FONT_MONO, FONT_SANS } from "./authStyles";

// The wordmark that sits above the auth card (from the Auth design).
export function AuthBrand({
  logoUrl,
  brandName = "Dig-IT",
}: {
  logoUrl?: string | null;
  brandName?: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        textDecoration: "none",
        marginBottom: 30,
      }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={brandName}
          style={{ height: 56, width: "auto", objectFit: "contain", borderRadius: 16 }}
        />
      ) : (
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: ACCENT_GRADIENT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 10px 24px -6px color-mix(in srgb, var(--color-indigo-700) 50%, transparent)",
          }}
        >
          <Wrench style={{ width: 26, height: 26, color: "#fff" }} />
        </span>
      )}
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-0.02em",
            color: "#181b27",
          }}
        >
          {brandName}
        </span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#9298ab",
            marginTop: 4,
          }}
        >
          IT OPERATIONS MARKETPLACE
        </span>
      </span>
    </div>
  );
}
