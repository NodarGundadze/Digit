import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBranding } from "@/lib/settings";
import { roleHome, type Role } from "@/lib/types";
import { AuthBrand } from "@/components/auth/AuthBrand";
import { FONT_MONO, FONT_SANS } from "@/components/auth/authStyles";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role as Role));

  const { logoUrl, brandName } = await getBranding();

  return (
    <div
      className="auth-scope"
      style={{
        fontFamily: FONT_SANS,
        minHeight: "100vh",
        background: "linear-gradient(160deg,#eef1f7 0%,#f4f6fa 45%,#f7f9fc 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "56px 24px 64px",
        WebkitFontSmoothing: "antialiased",
        color: "#1c2030",
      }}
    >
      <AuthBrand logoUrl={logoUrl} brandName={brandName} />
      {children}
      <p
        style={{
          marginTop: 34,
          fontFamily: FONT_MONO,
          fontSize: 12,
          letterSpacing: "0.08em",
          color: "#aab0c0",
        }}
      >
        {brandName.toUpperCase()} OPERATIONS PLATFORM © 2026
      </p>
    </div>
  );
}
