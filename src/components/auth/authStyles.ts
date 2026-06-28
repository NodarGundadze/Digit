// Shared inline-style tokens for the auth screens, lifted verbatim from the
// Dig-IT Auth design (claude.ai/design) so login + register stay pixel-identical.
import type { CSSProperties } from "react";

export const FONT_SANS = "var(--font-gantari), system-ui, sans-serif";
export const FONT_MONO = "var(--font-space-mono), monospace";
// Accent colors follow the admin-chosen brand color via the indigo tokens.
export const ACCENT_GRADIENT =
  "linear-gradient(150deg, var(--color-indigo-500), var(--color-indigo-700))";
export const ACCENT_LINK = "var(--color-indigo-600)";

export const card: CSSProperties = {
  width: "100%",
  maxWidth: 560,
  background: "#fff",
  border: "1px solid #e9ecf3",
  borderRadius: 22,
  padding: "40px 44px 44px",
  boxShadow:
    "0 30px 60px -34px rgba(40,44,80,0.34), 0 1px 2px rgba(20,24,40,0.04)",
};

export const heading: CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: "-0.025em",
  color: "#181b27",
};

export const sub: CSSProperties = {
  margin: "8px 0 0",
  fontSize: 16,
  color: "#6b7388",
};

export const label: CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: "0.05em",
  color: "#454c61",
  marginBottom: 9,
};

export const input: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #e3e6ef",
  borderRadius: 12,
  fontFamily: FONT_SANS,
  fontSize: 15,
  color: "#1c2030",
  background: "#fbfbfe",
  transition: "border-color .16s ease, box-shadow .16s ease, background .16s ease",
};

export const textarea: CSSProperties = {
  ...input,
  resize: "vertical",
  minHeight: 84,
  lineHeight: 1.5,
};

export const submit: CSSProperties = {
  marginTop: 28,
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "15px 24px",
  border: "none",
  borderRadius: 13,
  background: ACCENT_GRADIENT,
  color: "#fff",
  fontFamily: FONT_SANS,
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  boxShadow:
    "0 12px 26px -10px color-mix(in srgb, var(--color-indigo-700) 60%, transparent)",
  transition: "transform .18s ease, box-shadow .18s ease",
};

export const switchRow: CSSProperties = {
  textAlign: "center",
  margin: "22px 0 0",
  fontSize: 15,
  color: "#6b7388",
};

export const link: CSSProperties = {
  fontWeight: 700,
  color: ACCENT_LINK,
  textDecoration: "none",
};

// Inline error banner (the design has no error state; styled to match its palette).
export const errorBanner: CSSProperties = {
  marginTop: 22,
  fontSize: 13.5,
  background: "#fef2f2",
  border: "1px solid #f6cdd2",
  color: "#c43d4b",
  borderRadius: 12,
  padding: "11px 14px",
};
