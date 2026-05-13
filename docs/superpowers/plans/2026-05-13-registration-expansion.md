# Registration Form Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the 2-step registration form into a 4-step flow (Account → Type → Details → Confirm) that collects company or personal information with SA address fields and requires T&C acceptance.

**Architecture:** Rewrite `src/app/auth/register/page.tsx` as a 4-step client component with colocated sub-components for each step. The API route is extended to accept the new fields and persist extra data into `org_settings.registration_data` JSONB. A static `/legal/terms` page is added.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, CSS Modules (`auth.module.css`), Supabase admin client, bcryptjs

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/types/index.ts` | Add `RegistrationData` types + `registration_data` to `OrgSettings` |
| Modify | `src/app/auth/auth.module.css` | Add CSS classes for type cards, 2-col grid, address section, T&C box, confirm summary, wide shell |
| Create | `src/app/auth/register/AddressFields.tsx` | Reusable SA address field group |
| Create | `src/app/auth/register/CompanyFields.tsx` | Company detail fields (industry, size, phone, website, VAT, address) |
| Create | `src/app/auth/register/PersonalFields.tsx` | Personal detail fields (phone, ID, hear about, use case, address) |
| Create | `src/app/auth/register/ConfirmStep.tsx` | Summary table + scrollable T&C box + checkbox |
| Rewrite | `src/app/auth/register/page.tsx` | 4-step form orchestrator |
| Modify | `src/app/api/auth/register/route.ts` | Accept `accountType`, `registrationData`, `agreedToTerms`; persist to `org_settings` |
| Create | `src/app/legal/terms/page.tsx` | Static Terms & Conditions page |

---

## Task 1: Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add registration data types**

Open `src/types/index.ts` and add the following before the `OrgSettings` interface:

```ts
export interface SAAddress {
  unit: string;
  street: string;
  suburb: string;
  city: string;
  postal_code: string;
  province: string;
}

export interface CompanyRegistrationData {
  account_type: "company";
  company_name: string;
  industry: string;
  company_size: string;
  phone: string;
  website: string;
  vat: string;
  address: SAAddress;
}

export interface PersonalRegistrationData {
  account_type: "personal";
  phone: string;
  id_number: string;
  hear_about: string;
  use_case: string;
  address: SAAddress;
}

export type RegistrationData = CompanyRegistrationData | PersonalRegistrationData;
```

- [ ] **Step 2: Add `registration_data` to `OrgSettings`**

In `src/types/index.ts`, inside the existing `OrgSettings` interface, add after `n8n_api_key`:

```ts
  registration_data?: RegistrationData;
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(register): add RegistrationData and SAAddress types"
```

---

## Task 2: CSS Classes

**Files:**
- Modify: `src/app/auth/auth.module.css`

- [ ] **Step 1: Append new classes to the end of `auth.module.css`**

```css
/* ── Wide shell (steps 3 & 4) ─────────────────────────────── */
.shellWide {
  width: 100%;
  max-width: 560px;
}

/* ── Step 3 — two-column field grid ──────────────────────────*/
.fieldGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.fieldSpan2 {
  grid-column: span 2;
}

/* ── Account type selector cards ────────────────────────────*/
.typeCards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 4px;
}

.typeCard {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;
}

.typeCard:hover {
  border-color: #94a3b8;
}

.typeCardSelected {
  border-color: #0f766e;
  background: #f0fdfa;
}

.typeCardIcon {
  font-size: 2rem;
  margin-bottom: 10px;
  line-height: 1;
}

.typeCardTitle {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}

.typeCardSub {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
}

/* ── Address section separator ──────────────────────────────*/
.addressSection {
  grid-column: span 2;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.addressLabel {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin: 0 0 10px;
}

/* ── Select input (same look as .input) ─────────────────────*/
.select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #fff;
  color: #0f172a;
  font-size: 1rem;
  line-height: 1.5;
  padding: 12px 14px;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 40px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  cursor: pointer;
}

.select:focus {
  border-color: #0f766e;
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.14);
}

/* ── Confirm summary ────────────────────────────────────────*/
.confirmSummary {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  font-size: 0.88rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirmRow {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.confirmKey {
  color: #64748b;
  flex-shrink: 0;
}

.confirmValue {
  font-weight: 600;
  color: #0f172a;
  text-align: right;
}

.confirmDivider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

/* ── T&C box ────────────────────────────────────────────────*/
.termsBox {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 16px;
}

.termsBoxHeader {
  background: #f8fafc;
  padding: 10px 14px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.termsBoxBody {
  padding: 14px;
  max-height: 180px;
  overflow-y: auto;
  font-size: 0.82rem;
  line-height: 1.7;
  color: #475569;
}

.termsBoxBody h4 {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
  margin: 12px 0 2px;
}

.termsBoxBody h4:first-child {
  margin-top: 0;
}

/* ── T&C checkbox row ───────────────────────────────────────*/
.termsCheck {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 14px;
  cursor: pointer;
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.5;
}

.termsCheck input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: #0f766e;
  cursor: pointer;
}

.termsLink {
  color: #0f766e;
  text-decoration: underline;
  font-weight: 600;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/auth.module.css
git commit -m "feat(register): add CSS classes for 4-step registration form"
```

---

## Task 3: AddressFields Component

**Files:**
- Create: `src/app/auth/register/AddressFields.tsx`

- [ ] **Step 1: Create the component**

```tsx
import styles from "../auth.module.css";
import type { SAAddress } from "@/types";

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

interface Props {
  label: string;
  value: SAAddress;
  onChange: (value: SAAddress) => void;
}

export default function AddressFields({ label, value, onChange }: Props) {
  function update(field: keyof SAAddress, v: string) {
    onChange({ ...value, [field]: v });
  }

  return (
    <div className={`${styles.addressSection} ${styles.fieldSpan2}`}>
      <p className={styles.addressLabel}>{label}</p>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label}>Unit / {label.includes("Home") ? "Flat" : "Building"} number</label>
          <input
            className={styles.input}
            placeholder="Optional"
            value={value.unit}
            onChange={(e) => update("unit", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Street number &amp; name</label>
          <input
            className={styles.input}
            placeholder="e.g. 123 Main Street"
            value={value.street}
            onChange={(e) => update("street", e.target.value)}
            required
          />
        </div>
        <div className={`${styles.field} ${styles.fieldSpan2}`}>
          <label className={styles.label}>Suburb</label>
          <input
            className={styles.input}
            placeholder="e.g. Sandton"
            value={value.suburb}
            onChange={(e) => update("suburb", e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>City / Town</label>
          <input
            className={styles.input}
            placeholder="e.g. Johannesburg"
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Postal code</label>
          <input
            className={styles.input}
            placeholder="e.g. 2196"
            value={value.postal_code}
            onChange={(e) => update("postal_code", e.target.value)}
            required
            pattern="\d{4}"
            title="4-digit SA postal code"
          />
        </div>
        <div className={`${styles.field} ${styles.fieldSpan2}`}>
          <label className={styles.label}>Province</label>
          <select
            className={styles.select}
            value={value.province}
            onChange={(e) => update("province", e.target.value)}
            required
          >
            <option value="" disabled>Select province</option>
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/register/AddressFields.tsx
git commit -m "feat(register): add AddressFields component with SA provinces"
```

---

## Task 4: CompanyFields Component

**Files:**
- Create: `src/app/auth/register/CompanyFields.tsx`

- [ ] **Step 1: Create the component**

```tsx
import styles from "../auth.module.css";
import AddressFields from "./AddressFields";
import type { CompanyRegistrationData } from "@/types";

const INDUSTRIES = [
  "Technology", "E-commerce", "Healthcare", "Finance",
  "Real Estate", "Retail", "Marketing", "Other",
];

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

interface Props {
  value: Omit<CompanyRegistrationData, "account_type">;
  onChange: (value: Omit<CompanyRegistrationData, "account_type">) => void;
}

export default function CompanyFields({ value, onChange }: Props) {
  function update<K extends keyof Omit<CompanyRegistrationData, "account_type">>(
    field: K,
    v: Omit<CompanyRegistrationData, "account_type">[K]
  ) {
    onChange({ ...value, [field]: v });
  }

  return (
    <div className={styles.fieldGrid}>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label className={styles.label}>Company name</label>
        <input
          className={styles.input}
          placeholder="Acme Corp"
          value={value.company_name}
          onChange={(e) => update("company_name", e.target.value)}
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Industry</label>
        <select
          className={styles.select}
          value={value.industry}
          onChange={(e) => update("industry", e.target.value)}
          required
        >
          <option value="" disabled>Select industry</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Company size</label>
        <select
          className={styles.select}
          value={value.company_size}
          onChange={(e) => update("company_size", e.target.value)}
          required
        >
          <option value="" disabled>Select size</option>
          {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label className={styles.label}>Business phone</label>
        <input
          className={styles.input}
          type="tel"
          placeholder="+27 11 000 0000"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
      </div>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label className={styles.label}>Company website <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
        <input
          className={styles.input}
          type="url"
          placeholder="https://yourcompany.com"
          value={value.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label className={styles.label}>VAT / Registration number <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
        <input
          className={styles.input}
          placeholder="e.g. 4110203456"
          value={value.vat}
          onChange={(e) => update("vat", e.target.value)}
        />
      </div>
      <AddressFields
        label="Business address"
        value={value.address}
        onChange={(addr) => update("address", addr)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/register/CompanyFields.tsx
git commit -m "feat(register): add CompanyFields component"
```

---

## Task 5: PersonalFields Component

**Files:**
- Create: `src/app/auth/register/PersonalFields.tsx`

- [ ] **Step 1: Create the component**

```tsx
import styles from "../auth.module.css";
import AddressFields from "./AddressFields";
import type { PersonalRegistrationData } from "@/types";

const HEAR_ABOUT_OPTIONS = ["Google", "Social media", "Friend / referral", "Other"];
const USE_CASE_OPTIONS   = ["Personal projects", "Freelancing", "Side business", "Other"];

interface Props {
  value: Omit<PersonalRegistrationData, "account_type">;
  onChange: (value: Omit<PersonalRegistrationData, "account_type">) => void;
}

export default function PersonalFields({ value, onChange }: Props) {
  function update<K extends keyof Omit<PersonalRegistrationData, "account_type">>(
    field: K,
    v: Omit<PersonalRegistrationData, "account_type">[K]
  ) {
    onChange({ ...value, [field]: v });
  }

  return (
    <div className={styles.fieldGrid}>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label className={styles.label}>Phone number</label>
        <input
          className={styles.input}
          type="tel"
          placeholder="+27 82 000 0000"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
      </div>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label className={styles.label}>ID number</label>
        <input
          className={styles.input}
          placeholder="13-digit SA ID number"
          value={value.id_number}
          onChange={(e) => update("id_number", e.target.value)}
          required
          maxLength={13}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>How did you hear about us?</label>
        <select
          className={styles.select}
          value={value.hear_about}
          onChange={(e) => update("hear_about", e.target.value)}
          required
        >
          <option value="" disabled>Select one</option>
          {HEAR_ABOUT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>What will you use SyncChat for?</label>
        <select
          className={styles.select}
          value={value.use_case}
          onChange={(e) => update("use_case", e.target.value)}
          required
        >
          <option value="" disabled>Select one</option>
          {USE_CASE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <AddressFields
        label="Home address"
        value={value.address}
        onChange={(addr) => update("address", addr)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/register/PersonalFields.tsx
git commit -m "feat(register): add PersonalFields component"
```

---

## Task 6: ConfirmStep Component

**Files:**
- Create: `src/app/auth/register/ConfirmStep.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from "next/link";
import styles from "../auth.module.css";
import type { RegistrationData } from "@/types";

interface Props {
  fullName: string;
  email: string;
  data: RegistrationData;
  agreedToTerms: boolean;
  onToggleTerms: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className={styles.confirmRow}>
      <span className={styles.confirmKey}>{label}</span>
      <span className={styles.confirmValue}>{value}</span>
    </div>
  );
}

export default function ConfirmStep({ fullName, email, data, agreedToTerms, onToggleTerms }: Props) {
  const address = data.address;
  const formattedAddress = [
    address.unit,
    address.street,
    address.suburb,
    `${address.city}, ${address.postal_code}`,
    address.province,
  ].filter(Boolean).join("\n");

  return (
    <>
      <div className={styles.confirmSummary}>
        <Row label="Name"  value={fullName} />
        <Row label="Email" value={email} />
        <div className={styles.confirmDivider} />
        <Row label="Account type" value={data.account_type === "company" ? "Company" : "Individual"} />
        {data.account_type === "company" ? (
          <>
            <Row label="Company"  value={data.company_name} />
            <Row label="Industry" value={data.industry} />
            <Row label="Size"     value={data.company_size} />
            <Row label="Phone"    value={data.phone} />
            {data.website && <Row label="Website" value={data.website} />}
            {data.vat     && <Row label="VAT"     value={data.vat} />}
          </>
        ) : (
          <>
            <Row label="Phone"    value={data.phone} />
            <Row label="ID no."   value={data.id_number} />
            <Row label="Source"   value={data.hear_about} />
            <Row label="Use case" value={data.use_case} />
          </>
        )}
        <div className={styles.confirmDivider} />
        <div className={styles.confirmRow}>
          <span className={styles.confirmKey}>Address</span>
          <span className={`${styles.confirmValue}`} style={{ whiteSpace: "pre-line" }}>
            {formattedAddress}
          </span>
        </div>
      </div>

      <div className={styles.termsBox}>
        <div className={styles.termsBoxHeader}>Terms &amp; Conditions</div>
        <div className={styles.termsBoxBody}>
          <h4>1. Service</h4>
          <p>SyncChat provides a WhatsApp messaging platform powered by UltraMsg. By registering you gain access to send and receive WhatsApp messages through our managed infrastructure.</p>
          <h4>2. Acceptable use</h4>
          <p>You may not use SyncChat to send spam, unsolicited bulk messages, illegal content, or messages that violate WhatsApp's Terms of Service. Violations may result in immediate account suspension.</p>
          <h4>3. Trial period</h4>
          <p>New accounts receive a 14-day free trial. At the end of the trial period a paid subscription is required to continue using the platform.</p>
          <h4>4. Subscriptions &amp; billing</h4>
          <p>Subscriptions are billed in ZAR via Paystack. You may cancel at any time; access continues until the end of the current billing period. No refunds are issued for partial periods.</p>
          <h4>5. Data &amp; privacy</h4>
          <p>We store message metadata and account information necessary to operate the service. We do not sell your data. Message content may be stored temporarily for delivery purposes and is subject to our Privacy Policy.</p>
          <h4>6. WhatsApp compliance</h4>
          <p>Your use of SyncChat is subject to WhatsApp's Business Policy. You are responsible for ensuring your messaging activity complies with applicable laws, including POPIA (South Africa).</p>
          <h4>7. Limitation of liability</h4>
          <p>SyncChat is not liable for message delivery failures, WhatsApp service interruptions, or losses resulting from account suspension due to policy violations.</p>
          <h4>8. Governing law</h4>
          <p>These terms are governed by the laws of the Republic of South Africa.</p>
        </div>
      </div>

      <label className={styles.termsCheck}>
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={onToggleTerms}
        />
        <span>
          I have read and agree to the{" "}
          <Link href="/legal/terms" target="_blank" className={styles.termsLink}>
            Terms &amp; Conditions
          </Link>
        </span>
      </label>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/register/ConfirmStep.tsx
git commit -m "feat(register): add ConfirmStep with T&C checkbox"
```

---

## Task 7: Rewrite Register Page

**Files:**
- Rewrite: `src/app/auth/register/page.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
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
  unit: "", street: "", suburb: "", city: "", postal_code: "", province: "",
};

const EMPTY_COMPANY: Omit<CompanyRegistrationData, "account_type"> = {
  company_name: "", industry: "", company_size: "", phone: "",
  website: "", vat: "", address: EMPTY_ADDRESS,
};

const EMPTY_PERSONAL: Omit<PersonalRegistrationData, "account_type"> = {
  phone: "", id_number: "", hear_about: "", use_case: "", address: EMPTY_ADDRESS,
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
                  <label className={styles.label}>Full name</label>
                  <input className={styles.input} placeholder="John Smith" value={account.fullName} onChange={(e) => updateAccount("fullName", e.target.value)} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input type="email" className={styles.input} placeholder="you@company.com" value={account.email} onChange={(e) => updateAccount("email", e.target.value)} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input type="password" className={styles.input} placeholder="Min 8 characters" value={account.password} onChange={(e) => updateAccount("password", e.target.value)} required minLength={8} />
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
```

- [ ] **Step 2: Start dev server and verify the form renders without errors**

```bash
npm run dev
```

Open http://localhost:3000/auth/register — you should see Step 1 with the 4-bubble step indicator. Click through each step to verify navigation works and sub-components render.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/register/page.tsx
git commit -m "feat(register): rewrite as 4-step form — Account, Type, Details, Confirm"
```

---

## Task 8: Extend Register API Route

**Files:**
- Modify: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Replace the `POST` handler and add `registrationData` persistence**

The existing `registerWithAdminClient` function creates the org and then inserts into `org_settings`. Extend it to also set `registration_data` in that `org_settings` insert. Update the `POST` handler to validate and pass through the new fields.

Replace `src/app/api/auth/register/route.ts` entirely with:

```ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import type { RegistrationData } from "@/types";

type RegistrationResult = {
  userId: string;
  orgId: string;
  email: string;
};

async function registerWithAdminClient(args: {
  name: string;
  email: string;
  passwordHash: string;
  orgName: string;
  registrationData: RegistrationData;
}): Promise<RegistrationResult> {
  const { name, email, passwordHash, orgName, registrationData } = args;
  const supabase = createAdminClient();

  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(`Unable to verify account state. ${lookupError.message}`);
  if (existingUser) throw new Error("An account with this email already exists");

  const slugBase =
    orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "organization";
  const slug = `${slugBase}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName.trim(), slug, plan: "free", trial_ends_at: trialEndsAt })
    .select("id")
    .single();

  if (orgError || !organization?.id) throw new Error(orgError?.message ?? "Failed to create organization");

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({ email, name: name.trim(), password_hash: passwordHash, org_id: organization.id, role: "admin", is_active: true })
    .select("id")
    .single();

  if (userError || !user?.id) {
    await supabase.from("organizations").delete().eq("id", organization.id);
    throw new Error(userError?.message ?? "Failed to create account");
  }

  const { error: memberError } = await supabase.from("org_members").insert({
    org_id: organization.id, user_id: user.id, role: "org_admin", is_active: true,
  });

  if (memberError) {
    await supabase.from("users").delete().eq("id", user.id);
    await supabase.from("organizations").delete().eq("id", organization.id);
    throw new Error(memberError.message ?? "Failed to create team membership");
  }

  const { error: settingsError } = await supabase.from("org_settings").insert({
    org_id: organization.id,
    auto_reply_enabled: false,
    auto_reply_message: "",
    business_hours_enabled: false,
    registration_data: registrationData,
  });

  if (settingsError) {
    await supabase.from("org_members").delete().eq("user_id", user.id);
    await supabase.from("users").delete().eq("id", user.id);
    await supabase.from("organizations").delete().eq("id", organization.id);
    throw new Error(settingsError.message ?? "Failed to create organization settings");
  }

  return { userId: user.id, orgId: organization.id, email };
}

async function registerWithRpc(args: {
  name: string;
  email: string;
  passwordHash: string;
  orgName: string;
  orgId?: string;
  registrationData: RegistrationData;
}): Promise<RegistrationResult> {
  const { name, email, passwordHash, orgName, registrationData } = args;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("register_account_and_organization", {
    p_name: name.trim(),
    p_email: email,
    p_password_hash: passwordHash,
    p_org_name: orgName.trim(),
  });

  if (error) {
    throw new Error(
      error.message.includes("register_account_and_organization")
        ? "Signup database function is missing. Apply the syncchat.register_account_and_organization migration in Supabase."
        : error.message
    );
  }

  const created = Array.isArray(data) ? data[0] : data;
  const userId = created?.user_id;
  const orgId  = created?.org_id;
  if (!userId || !orgId) throw new Error("Failed to create account");

  // Persist registration data (best-effort — org was already created by rpc)
  await createAdminClient()
    .from("org_settings")
    .update({ registration_data: registrationData })
    .eq("org_id", orgId);

  return { userId, orgId, email };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      password?: string;
      orgName?: string;
      accountType?: string;
      registrationData?: unknown;
      agreedToTerms?: unknown;
    };

    const { name, email, password, orgName, accountType, registrationData, agreedToTerms } = body;

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!accountType || (accountType !== "company" && accountType !== "personal")) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }
    if (!agreedToTerms) {
      return NextResponse.json({ error: "You must accept the Terms & Conditions" }, { status: 400 });
    }
    if (!registrationData || typeof registrationData !== "object") {
      return NextResponse.json({ error: "Registration details are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash    = await bcrypt.hash(password, 12);
    const regData = registrationData as RegistrationData;
    let account: RegistrationResult | null = null;

    try {
      account = await registerWithAdminClient({ name, email: normalizedEmail, passwordHash, orgName, registrationData: regData });
    } catch (err) {
      console.warn("[register] admin path failed, falling back to rpc:", err);
    }

    if (!account) {
      account = await registerWithRpc({ name, email: normalizedEmail, passwordHash, orgName, registrationData: regData });
    }

    const sessionToken = createSession(account.userId, normalizedEmail);
    const response = NextResponse.json({ success: true });
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to create account";
    console.error("[auth/register]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Run a quick smoke test**

With the dev server running, open http://localhost:3000/auth/register and complete all 4 steps with valid data. Tick the T&C checkbox and submit. Verify:
- You land on `/dashboard`
- Check Supabase `org_settings` table — `registration_data` column should contain the JSON you submitted

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat(register): extend API to accept accountType, registrationData, agreedToTerms"
```

---

## Task 9: Legal Terms Page

**Files:**
- Create: `src/app/legal/terms/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import Link from "next/link";

export const metadata = { title: "Terms & Conditions — SyncChat" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 mb-8 inline-block">← Back</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-slate-500 mb-10 text-sm">Last updated: May 2026</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Service</h2>
            <p>SyncChat provides a WhatsApp messaging platform powered by UltraMsg. By registering you gain access to send and receive WhatsApp messages through our managed infrastructure. The platform is operated by Leadsync and is subject to these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Acceptable use</h2>
            <p>You may not use SyncChat to send spam, unsolicited bulk messages, illegal content, or messages that violate WhatsApp's Terms of Service or Business Policy. You may not use the platform for phishing, fraud, harassment, or distribution of malware. Violations may result in immediate account suspension without refund.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Trial period</h2>
            <p>New accounts receive a 14-day free trial with full platform access. At the end of the trial period a paid subscription is required to continue using the platform. No credit card is required during the trial.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Subscriptions &amp; billing</h2>
            <p>Subscriptions are billed in South African Rand (ZAR) via Paystack on a monthly or annual basis. You may cancel your subscription at any time; access continues until the end of the current billing period. No refunds are issued for partial billing periods. Prices may change with 30 days notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Data &amp; privacy</h2>
            <p>We store message metadata and account information necessary to operate the service. We do not sell your personal data to third parties. Message content may be stored temporarily for delivery and reliability purposes. You retain ownership of your data and may request deletion by contacting support. Our data practices comply with the Protection of Personal Information Act (POPIA) of South Africa.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">6. WhatsApp compliance</h2>
            <p>Your use of SyncChat is subject to WhatsApp's Business Policy and Terms of Service. You are solely responsible for ensuring your messaging activity complies with all applicable laws, including POPIA (South Africa), the Electronic Communications and Transactions Act (ECTA), and any applicable anti-spam legislation. SyncChat reserves the right to suspend accounts in breach of WhatsApp's policies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Limitation of liability</h2>
            <p>SyncChat is not liable for message delivery failures, WhatsApp service interruptions, data loss, or any losses resulting from account suspension due to policy violations. The platform is provided "as is" without warranty of uninterrupted availability. Our total liability to you shall not exceed the fees paid in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Termination</h2>
            <p>You may terminate your account at any time. We may terminate or suspend your account if you breach these terms, fail to pay, or if we are required to do so by law. Upon termination, your data will be retained for 30 days before deletion.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Governing law</h2>
            <p>These terms are governed by the laws of the Republic of South Africa. Any disputes shall be resolved in the courts of South Africa. If any provision of these terms is found to be unenforceable, the remaining provisions continue in full force.</p>
          </section>
        </div>

        <p className="mt-12 text-sm text-slate-400">Questions? Contact us at support@syncchat.co.za</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify page loads**

Open http://localhost:3000/legal/terms — should show the full terms page with all 9 sections. Also verify that the link in the ConfirmStep checkbox opens this page in a new tab.

- [ ] **Step 3: Commit**

```bash
git add src/app/legal/terms/page.tsx
git commit -m "feat: add /legal/terms page with full SyncChat T&C"
```

---

## Task 10: End-to-end verification

- [ ] **Step 1: Full company registration flow**

1. Go to http://localhost:3000/auth/register
2. Step 1: enter name, email, password → Continue
3. Step 2: select Company → Continue
4. Step 3: fill all company fields including SA address → Continue
5. Step 4: verify summary shows correct data; scroll T&C box; tick checkbox; click Create account
6. Confirm redirect to `/dashboard`
7. In Supabase SQL Editor run:
   ```sql
   select registration_data from syncchat.org_settings order by created_at desc limit 1;
   ```
   Confirm the JSON contains all company fields and address.

- [ ] **Step 2: Full individual registration flow**

Repeat with a different email, selecting Individual at step 2. Confirm `registration_data` in `org_settings` contains the personal fields.

- [ ] **Step 3: T&C gate**

On step 4, leave the checkbox unticked and click Create account. Confirm the error message "You must accept the Terms & Conditions" appears and no request is sent.

- [ ] **Step 4: Back navigation**

Click Back from each step and confirm the previously entered data is still populated.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(register): 4-step registration form with SA address fields and T&C — complete"
```
