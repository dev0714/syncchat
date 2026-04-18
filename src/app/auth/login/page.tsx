"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Eye, EyeOff } from "lucide-react";
import styles from "../auth.module.css";

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

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to website
        </Link>

        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <MessageSquare className="w-8 h-8 text-whatsapp-green" />
          </div>
          <h1 className={styles.brandTitle}>SyncChat</h1>
          <p className={styles.brandSubtitle}>WhatsApp Business Platform</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Sign in to your account</h2>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <input
                type="email"
                className={styles.input}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <input
                  type={showPass ? "text" : "password"}
                  className={`${styles.input} ${styles.inputPassword}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={styles.toggleButton}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" disabled={loading} className={styles.primaryButton}>
              {loading && <span className={styles.spinner} />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className={styles.footer}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className={styles.link}>
              Create one
            </Link>
          </div>
        </div>

        <p className={styles.mutedFooter}>Powered by SyncChat &amp; Supabase</p>
      </div>
    </div>
  );
}
