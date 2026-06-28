"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Briefcase, Check, Loader2, User, UserPlus } from "lucide-react";
import { registerAction, type AuthState } from "@/lib/actions/auth";
import type { CSSProperties } from "react";
import {
  card,
  errorBanner,
  FONT_SANS,
  heading,
  input,
  label,
  link,
  submit,
  sub,
  switchRow,
  textarea,
} from "./authStyles";

const roleBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  padding: "14px 0",
  borderRadius: 13,
  fontFamily: FONT_SANS,
  fontWeight: 700,
  fontSize: 15.5,
  cursor: "pointer",
  transition: "all .16s ease",
};
const roleOn: CSSProperties = {
  ...roleBase,
  background: "#eceaff",
  border: "1.5px solid #b9adff",
  color: "#4f33ea",
};
const roleOff: CSSProperties = {
  ...roleBase,
  background: "#fff",
  border: "1.5px solid #e3e6ef",
  color: "#454c61",
};

const skillBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
  padding: "13px 15px",
  borderRadius: 12,
  fontFamily: FONT_SANS,
  fontSize: 14.5,
  fontWeight: 600,
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
  transition: "all .14s ease",
};

export default function RegisterForm({ skillTags }: { skillTags: string[] }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    registerAction,
    {}
  );
  const [role, setRole] = useState<"customer" | "worker">("customer");
  const [skills, setSkills] = useState<string[]>([]);
  const isSpecialist = role === "worker";

  const toggleSkill = (tag: string) =>
    setSkills((s) => (s.includes(tag) ? s.filter((x) => x !== tag) : [...s, tag]));

  return (
    <form action={formAction} style={card}>
      <h1 style={heading}>Create account</h1>
      <p style={sub}>Join Dig-IT as a customer or a specialist.</p>

      {state.error && <div style={errorBanner}>{state.error}</div>}

      <input type="hidden" name="role" value={role} />

      {/* Role toggle */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginTop: 28,
        }}
      >
        <button
          type="button"
          onClick={() => setRole("customer")}
          className="auth-press"
          style={role === "customer" ? roleOn : roleOff}
        >
          <User style={{ width: 18, height: 18 }} /> Customer
        </button>
        <button
          type="button"
          onClick={() => setRole("worker")}
          className="auth-press"
          style={isSpecialist ? roleOn : roleOff}
        >
          <Briefcase style={{ width: 18, height: 18 }} /> Specialist
        </button>
      </div>

      {/* Full name */}
      <div style={{ marginTop: 26 }}>
        <label style={label}>FULL NAME</label>
        <input name="name" type="text" placeholder="Jane Doe" style={input} />
      </div>

      {/* Email */}
      <div style={{ marginTop: 20 }}>
        <label style={label}>EMAIL</label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          style={input}
        />
      </div>

      {/* Phone + Password */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginTop: 20,
        }}
      >
        <div>
          <label style={label}>PHONE</label>
          <input name="phone" type="tel" placeholder="555-0123" style={input} />
        </div>
        <div>
          <label style={label}>PASSWORD</label>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="min 6 chars"
            style={input}
          />
        </div>
      </div>

      {/* Specialist-only */}
      {isSpecialist && (
        <div>
          <div style={{ marginTop: 22 }}>
            <label style={label}>BIO</label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Briefly describe your expertise…"
              style={textarea}
            />
          </div>

          <div style={{ marginTop: 22 }}>
            <label style={{ ...label, marginBottom: 12 }}>SKILL CATEGORIES</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {skillTags.map((tag) => {
                const on = skills.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleSkill(tag)}
                    className="auth-press"
                    style={{
                      ...skillBase,
                      background: on ? "#f5f3ff" : "#fff",
                      border: on ? "1.5px solid #b9adff" : "1.5px solid #e6e9f1",
                      color: on ? "#3a23c8" : "#454c61",
                    }}
                  >
                    <span
                      style={{
                        flex: "0 0 auto",
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .14s ease",
                        background: on ? "#4f33ea" : "#fff",
                        border: on ? "1.5px solid #4f33ea" : "1.5px solid #cdd2e0",
                      }}
                    >
                      {on && (
                        <Check style={{ width: 13, height: 13, color: "#fff" }} />
                      )}
                    </span>
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hidden inputs carry the selected tags to the server action. */}
          {skills.map((tag) => (
            <input key={tag} type="hidden" name="tags" value={tag} />
          ))}

          <p style={{ margin: "16px 0 0", fontSize: 13.5, color: "#c2751c" }}>
            New specialists start as{" "}
            <strong style={{ fontWeight: 700 }}>pending</strong> until an admin
            vets them.
          </p>
        </div>
      )}

      <button type="submit" disabled={pending} className="auth-submit" style={submit}>
        {pending ? (
          <Loader2 className="animate-spin" style={{ width: 19, height: 19 }} />
        ) : (
          <UserPlus style={{ width: 19, height: 19 }} />
        )}
        Create account
      </button>

      <p style={switchRow}>
        Already have an account?{" "}
        <Link href="/login" style={link}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
