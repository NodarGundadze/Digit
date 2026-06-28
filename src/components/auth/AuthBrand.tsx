import { Wrench } from "lucide-react";
import { FONT_MONO, FONT_SANS } from "./authStyles";

// The Dig-IT wordmark that sits above the auth card (from the Auth design).
export function AuthBrand() {
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
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(150deg,#5a40f0,#4429d6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 24px -6px rgba(74,45,214,0.5)",
        }}
      >
        <Wrench style={{ width: 26, height: 26, color: "#fff" }} />
      </span>
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
          Dig-IT
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
