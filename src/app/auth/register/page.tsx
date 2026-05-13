"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import PacmanLoader from "@/components/ui/PacmanLoader";
import CompanyFields from "./CompanyFields";
import PersonalFields from "./PersonalFields";
import ConfirmStep from "./ConfirmStep";
import styles from "../auth.module.css";
import type { CompanyRegistrationData, PersonalRegistrationData, SAAddress } from "@/types";

type Step = 1 | 2 | 3 | 4;
type AccountType = "company" | "personal";

const EMPTY_ADDRESS: SAAddress = {
  unit: undefined,
  street: "",
  suburb: "",
  city: "",
  postal_code: "",
  province: "" as SAAddress["province"],
};

const EMPTY_COMPANY: Omit<CompanyRegistrationData, "account_type"> = {
  company_name: "",
  industry: "" as CompanyRegistrationData["industry"],
  company_size: "" as CompanyRegistrationData["company_size"],
  phone: "",
  website: undefined,
  vat: undefined,
  address: EMPTY_ADDRESS,
};

const EMPTY_PERSONAL: Omit<PersonalRegistrationData, "account_type"> = {
  phone: "",
  id_number: "",
  hear_about: "" as PersonalRegistrationData["hear_about"],
  use_case: "" as PersonalRegistrationData["use_case"],
  address: EMPTY_ADDRESS,
};

const STEP_LABELS: Record<Step, string> = {
  1: "Account",
  2: "Type",
  3: "Details",
  4: "Confirm",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]               = useState<Step>(1);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [account, setAccount] = useState({ fullName: "", email: "", password: "" });
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [company, setCompany]   = useState(EMPTY_COMPANY);
  const [personal, setPersonal] = useState(EMPTY_PERSONAL);

  function updateAccount(field: keyof typeof account, value: string) {
    setAccount((prev) => ({ ...prev, [field]: value }));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(1, s - 1) as Step);
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep(2);
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!accountType) { setError("Please select an account type"); return; }
    setError("");
    setStep(3);
  }

  function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep(4);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedToTerms) { setError("You must accept the Terms & Conditions to continue"); return; }
    setError("");
    setLoading(true);

    const registrationData =
      accountType === "company"
        ? ({ account_type: "company", ...company } as CompanyRegistrationData)
        : ({ account_type: "personal", ...personal } as PersonalRegistrationData);

    const orgName =
      accountType === "company" ? company.company_name : account.fullName;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: account.fullName,
          email: account.email,
          password: account.password,
          orgName,
          accountType,
          registrationData,
          agreedToTerms,
        }),
      });

      const raw = await res.text();
      let data: { error?: string; success?: boolean } = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: raw || "Failed to create account" }; }

      if (!res.ok || data.error) {
        setError(data.error ?? `Failed to create account (${res.status})`);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isWide = step === 3 || step === 4;

  return (
    <div className={styles.page}>
      <div className={isWide ? styles.shellWide : styles.shell}>
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
          {/* Step indicator */}
          <div className={styles.registerSteps}>
            {([1, 2, 3, 4] as Step[]).map((s, i) => (
              <div key={s} className={styles.registerStep}>
                <div className={`${styles.registerStepBubble} ${step >= s ? styles.registerStepBubbleActive : ""}`}>
                  {step > s ? "✓" : s}
                </div>
                <span className={styles.registerStepLabel}>{STEP_LABELS[s]}</span>
                {i < 3 && <div className={styles.registerDivider} />}
              </div>
            ))}
          </div>

          {/* Step 1 — Account */}
          {step === 1 && (
            <form onSubmit={handleStep1} className={styles.form}>
              <div className={styles.registerStack}>
                <div className={styles.field}>
                  <label htmlFor="reg-name" className={styles.label}>Full name</label>
                  <input id="reg-name" className={styles.input} placeholder="John Smith" value={account.fullName} onChange={(e) => updateAccount("fullName", e.target.value)} required />
                </div>
                <div className={styles.field}>
                  <label htmlFor="reg-email" className={styles.label}>Email</label>
                  <input id="reg-email" type="email" className={styles.input} placeholder="you@company.com" value={account.email} onChange={(e) => updateAccount("email", e.target.value)} required />
                </div>
                <div className={styles.field}>
                  <label htmlFor="reg-password" className={styles.label}>Password</label>
                  <input id="reg-password" type="password" className={styles.input} placeholder="Min 8 characters" value={account.password} onChange={(e) => updateAccount("password", e.target.value)} required minLength={8} />
                </div>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.registerActions}>
                <button type="submit" className={styles.primaryButton}>Continue</button>
              </div>
            </form>
          )}

          {/* Step 2 — Type */}
          {step === 2 && (
            <form onSubmit={handleStep2} className={styles.form}>
              <div className={styles.typeCards}>
                <button
                  type="button"
                  className={`${styles.typeCard} ${accountType === "company" ? styles.typeCardSelected : ""}`}
                  onClick={() => setAccountType("company")}
                >
                  <div className={styles.typeCardIcon}>🏢</div>
                  <p className={styles.typeCardTitle}>Company</p>
                  <p className={styles.typeCardSub}>For businesses &amp; teams</p>
                </button>
                <button
                  type="button"
                  className={`${styles.typeCard} ${accountType === "personal" ? styles.typeCardSelected : ""}`}
                  onClick={() => setAccountType("personal")}
                >
                  <div className={styles.typeCardIcon}>👤</div>
                  <p className={styles.typeCardTitle}>Individual</p>
                  <p className={styles.typeCardSub}>For personal use</p>
                </button>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.registerActions}>
                <button type="button" onClick={goBack} className={styles.secondaryButton}>Back</button>
                <button type="submit" className={styles.primaryButton}>Continue</button>
              </div>
            </form>
          )}

          {/* Step 3 — Details */}
          {step === 3 && (
            <form onSubmit={handleStep3} className={styles.form}>
              {accountType === "company"
                ? <CompanyFields value={company} onChange={setCompany} />
                : <PersonalFields value={personal} onChange={setPersonal} />
              }
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.registerActions}>
                <button type="button" onClick={goBack} className={styles.secondaryButton}>Back</button>
                <button type="submit" className={styles.primaryButton}>Continue</button>
              </div>
            </form>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && accountType && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <ConfirmStep
                fullName={account.fullName}
                email={account.email}
                data={
                  accountType === "company"
                    ? ({ account_type: "company", ...company } as CompanyRegistrationData)
                    : ({ account_type: "personal", ...personal } as PersonalRegistrationData)
                }
                agreedToTerms={agreedToTerms}
                onToggleTerms={() => setAgreedToTerms((v) => !v)}
              />
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.registerActions}>
                <button type="button" onClick={goBack} className={styles.secondaryButton}>Back</button>
                <button type="submit" disabled={loading || !agreedToTerms} className={styles.primaryButton}>
                  {loading && <PacmanLoader size={14} className="mr-1.5" label="Creating account" />}
                  {loading ? "Creating..." : "Create account"}
                </button>
              </div>
            </form>
          )}

          <div className={styles.footer}>
            Already have an account?{" "}
            <Link href="/auth/login" className={styles.link}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
