"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import PacmanLoader from "@/components/ui/PacmanLoader";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "var(--paper)",
    fontSize: 15,
    color: "var(--ink)",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      background: "var(--bg)",
    }} className="auth-root">

      {/* ── LEFT: form panel ── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        padding: "40px 5vw",
        justifyContent: "space-between",
        minHeight: "100vh",
      }}>
        {/* Brand */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "var(--ink)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
            fontWeight: 700, fontSize: 18, letterSpacing: "-0.015em", color: "var(--ink)",
          }}>syncchat</span>
        </Link>

        {/* Form */}
        <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontSize: "clamp(2rem, 3.4vw, 2.6rem)",
              color: "var(--ink)", letterSpacing: "-0.025em",
              marginBottom: 10, lineHeight: 1.1,
            }}>
              Welcome{" "}
              <span style={{ color: "var(--teal-mid)", fontStyle: "italic" }}>back.</span>
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink-soft)" }}>
              Sign in to your Syncchat dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{
                fontSize: 12, fontWeight: 600, color: "var(--ink-soft)",
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase", letterSpacing: ".06em",
              }}>Email</span>
              <input
                type="email"
                placeholder="sarah@acme.co.za"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--teal)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(7,94,84,.08)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{
                fontSize: 12, fontWeight: 600, color: "var(--ink-soft)",
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase", letterSpacing: ".06em",
              }}>Password</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--teal)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(7,94,84,.08)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    width: 32, height: 32, borderRadius: 8,
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--muted)",
                  }}
                >
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </label>

            {error && (
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: "#FEF2F2", border: "1px solid #FECACA",
                color: "#DC2626", fontSize: 14,
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 22px", borderRadius: 12,
                background: "var(--ink)", color: "#fff",
                fontSize: 15, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.8 : 1,
                transition: "transform .15s, background .15s",
                fontFamily: "inherit",
              }}
            >
              {loading && <PacmanLoader size={14} label="Signing in"/>}
              {loading ? "Signing in…" : "Sign in"}
              {!loading && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>

            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              color: "var(--muted)", fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }}/>
              OR
              <div style={{ flex: 1, height: 1, background: "var(--line)" }}/>
            </div>

            <Link href="/auth/register" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 22px", borderRadius: 12,
              background: "transparent", color: "var(--ink)",
              border: "1px solid var(--line)",
              fontSize: 15, fontWeight: 600, textDecoration: "none",
              transition: "border-color .15s, background .15s",
            }}>
              Create an account
            </Link>
          </form>
        </div>

        {/* Bottom note */}
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
          © 2026 Syncchat · <Link href="/legal/terms" style={{ color: "var(--teal-mid)" }}>Terms</Link>
        </p>
      </div>

      {/* ── RIGHT: decorative panel ── */}
      <div style={{
        background: "var(--ink)",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: 48,
      }} className="auth-right-panel">
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle at 60% 30%, rgba(37,211,102,.18), transparent 50%), radial-gradient(circle at 20% 70%, rgba(106,79,182,.15), transparent 50%)`,
          pointerEvents: "none",
        }}/>

        {/* Mini chat preview */}
        <div style={{ position: "relative", width: "100%", maxWidth: 340 }}>
          <div style={{
            background: "#ECE5DD", borderRadius: 18, padding: 14,
            display: "flex", flexDirection: "column", gap: 8,
            boxShadow: "0 40px 80px -30px rgba(0,0,0,.5)",
          }}>
            {/* Chat header */}
            <div style={{
              background: "#075E54", borderRadius: 10,
              padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, color: "#fff",
              marginBottom: 4,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: "#25D366",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 12, color: "#075E54",
              }}>AI</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Acme Sneakers</div>
                <div style={{ fontSize: 11, opacity: .7 }}>AI agent · online</div>
              </div>
              <div style={{
                marginLeft: "auto", width: 8, height: 8,
                borderRadius: "50%", background: "#25D366",
              }}/>
            </div>

            {[
              { in: "Hi! Do you have Air Max size 9? 👟" },
              { out: "Hey Sarah! Yes — 3 pairs in stock at V&A. Want me to hold one?" },
              { in: "Yes please! Until 6pm 🙏" },
              { out: "Done ✅ Held under your name until 18:00. Need directions?" },
              { in: "You're a lifesaver 😍" },
            ].map((m, i) => {
              const isIn = !!m.in;
              return (
                <div key={i} style={{
                  alignSelf: isIn ? "flex-start" : "flex-end",
                  background: isIn ? "#fff" : "#D9FDD3",
                  padding: "8px 12px", borderRadius: 12,
                  borderBottomLeftRadius: isIn ? 4 : 12,
                  borderBottomRightRadius: isIn ? 12 : 4,
                  fontSize: 13, lineHeight: 1.4, maxWidth: "82%",
                  boxShadow: "0 1px 1px rgba(0,0,0,.06)",
                  color: "#0B1F1C",
                }}>
                  {m.in || m.out}
                </div>
              );
            })}
          </div>

          {/* Label */}
          <div style={{
            position: "absolute", top: -16, right: -16,
            background: "#25D366", color: "#0B1F1C",
            padding: "6px 12px", borderRadius: 50,
            fontSize: 12, fontWeight: 700,
          }}>
            Live AI agent
          </div>
        </div>

        {/* Tagline */}
        <div style={{ position: "relative", textAlign: "center", marginTop: 40, maxWidth: 320 }}>
          <p style={{
            fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
            fontSize: 22, fontWeight: 700, color: "#fff",
            letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 10,
          }}>
            Your WhatsApp,{" "}
            <span style={{ color: "#25D366", fontStyle: "italic" }}>on autopilot.</span>
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
            AI replies in your tone, 24/7 — while you focus on the business.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .auth-root { grid-template-columns: 1fr !important; }
          .auth-right-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
