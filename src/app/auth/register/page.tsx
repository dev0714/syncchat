"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"account" | "org">("account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    orgName: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "account") {
      setStep("org");
      return;
    }

    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
      },
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Failed to create account");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    const slug = generateSlug(form.orgName);

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: form.orgName, slug, plan: "free" })
      .select()
      .single();

    if (orgError || !org) {
      setError(orgError?.message ?? "Failed to create organization");
      setLoading(false);
      return;
    }

    await supabase.from("profiles").insert({
      id: userId,
      email: form.email,
      full_name: form.fullName,
    });

    await supabase.from("org_members").insert({
      org_id: org.id,
      user_id: userId,
      role: "org_admin",
    });

    router.push("/dashboard");
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
          <p className={styles.brandSubtitle}>Create your account</p>
        </div>

        <div className={styles.card}>
          <div className={styles.registerSteps}>
            {(["account", "org"] as const).map((s, i) => (
              <div key={s} className={styles.registerStep}>
                <div
                  className={`${styles.registerStepBubble} ${
                    step === s || (i === 0 && step === "org")
                      ? styles.registerStepBubbleActive
                      : ""
                  }`}
                >
                  {i + 1}
                </div>
                <span className={styles.registerStepLabel}>
                  {s === "account" ? "Account" : "Organization"}
                </span>
                {i === 0 && <div className={styles.registerDivider} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {step === "account" ? (
              <div className={styles.registerStack}>
                <div className={styles.field}>
                  <label className={styles.label}>Full name</label>
                  <input
                    className={styles.input}
                    placeholder="John Smith"
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.registerStack}>
                <div className={styles.field}>
                  <label className={styles.label}>Organization / Company name</label>
                  <input
                    className={styles.input}
                    placeholder="Acme Corp"
                    value={form.orgName}
                    onChange={(e) => update("orgName", e.target.value)}
                    required
                  />
                  <p className={styles.registerStepLabel} style={{ marginTop: 6 }}>
                    Slug: {generateSlug(form.orgName) || "your-company"}
                  </p>
                </div>

                <div className={styles.registerInfo}>
                  You will be set as <strong>Organization Admin</strong>. You can invite team members later.
                </div>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.registerActions}>
              {step === "org" && (
                <button type="button" onClick={() => setStep("account")} className={styles.secondaryButton}>
                  Back
                </button>
              )}
              <button type="submit" disabled={loading} className={styles.primaryButton}>
                {loading && <PacmanLoader size={14} className="mr-1.5" label="Creating account" />}
                {step === "account" ? "Continue" : loading ? "Creating..." : "Create account"}
              </button>
            </div>
          </form>

          <div className={styles.footer}>
            Already have an account?{" "}
            <Link href="/auth/login" className={styles.link}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
