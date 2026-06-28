"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import {
  card,
  errorBanner,
  FONT_MONO,
  FONT_SANS,
  heading,
  input,
  label,
  link,
  submit,
  sub,
  switchRow,
} from "./authStyles";

interface DemoAccount {
  name: string;
  email: string;
  pending?: boolean;
}

export default function LoginForm({
  demoAccounts,
  demoPassword,
}: {
  demoAccounts: DemoAccount[];
  demoPassword: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    {}
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const quickFill = (acct: DemoAccount) => {
    setEmail(acct.email);
    setPassword(demoPassword);
  };

  return (
    <>
      <form action={formAction} style={card}>
        <h1 style={heading}>Sign in</h1>
        <p style={sub}>Access your Dig-IT workspace.</p>

        {state.error && <div style={errorBanner}>{state.error}</div>}

        <div style={{ marginTop: 28 }}>
          <label style={label}>EMAIL</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />
        </div>

        <div style={{ marginTop: 22 }}>
          <label style={label}>PASSWORD</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />
        </div>

        <button type="submit" disabled={pending} className="auth-submit" style={submit}>
          {pending ? (
            <Loader2 className="animate-spin" style={{ width: 19, height: 19 }} />
          ) : (
            <LogIn style={{ width: 19, height: 19 }} />
          )}
          Sign in
        </button>

        <p style={switchRow}>
          New here?{" "}
          <Link href="/register" style={link}>
            Create an account
          </Link>
        </p>
      </form>

      <div
        style={{
          ...card,
          marginTop: 22,
          padding: "28px 32px 30px",
          boxShadow:
            "0 20px 44px -30px rgba(40,44,80,0.3), 0 1px 2px rgba(20,24,40,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#6a7187",
            }}
          >
            DEMO ACCOUNTS
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#aab0c0" }}>
            pwd: {demoPassword}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {demoAccounts.map((acct) => (
            <button
              key={acct.email}
              type="button"
              onClick={() => quickFill(acct)}
              className="auth-press"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "14px 16px",
                borderRadius: 13,
                textAlign: "left",
                cursor: "pointer",
                fontFamily: FONT_SANS,
                transition: "all .14s ease",
                background: acct.pending ? "#fffbeb" : "#fbfbfe",
                border: acct.pending
                  ? "1.5px solid #f4e3a8"
                  : "1.5px solid #e9ecf3",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14.5, color: "#1c2030" }}>
                {acct.name}
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12.5,
                  color: "#8b91a3",
                  marginTop: 3,
                }}
              >
                {acct.email}
              </span>
            </button>
          ))}
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 13, color: "#9298ab" }}>
          Click a chip to fill the form, then press Sign in.
        </p>
      </div>
    </>
  );
}
