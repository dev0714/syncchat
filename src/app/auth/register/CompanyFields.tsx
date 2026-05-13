import styles from "../auth.module.css";
import AddressFields from "./AddressFields";
import type { CompanyRegistrationData } from "@/types";

const INDUSTRIES = [
  "Technology", "E-commerce", "Healthcare", "Finance",
  "Real Estate", "Retail", "Marketing", "Other",
] as const;

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"] as const;

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
        <label htmlFor="co-name" className={styles.label}>Company name</label>
        <input
          id="co-name"
          className={styles.input}
          placeholder="Acme Corp"
          value={value.company_name}
          onChange={(e) => update("company_name", e.target.value)}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="co-industry" className={styles.label}>Industry</label>
        <select
          id="co-industry"
          className={styles.select}
          value={value.industry}
          onChange={(e) => update("industry", e.target.value as CompanyRegistrationData["industry"])}
          required
        >
          <option value="" disabled>Select industry</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="co-size" className={styles.label}>Company size</label>
        <select
          id="co-size"
          className={styles.select}
          value={value.company_size}
          onChange={(e) => update("company_size", e.target.value as CompanyRegistrationData["company_size"])}
          required
        >
          <option value="" disabled>Select size</option>
          {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label htmlFor="co-phone" className={styles.label}>Business phone</label>
        <input
          id="co-phone"
          className={styles.input}
          type="tel"
          placeholder="+27 11 000 0000"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
      </div>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label htmlFor="co-website" className={styles.label}>
          Company website <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
        </label>
        <input
          id="co-website"
          className={styles.input}
          type="url"
          placeholder="https://yourcompany.com"
          value={value.website ?? ""}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label htmlFor="co-vat" className={styles.label}>
          VAT / Registration number <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
        </label>
        <input
          id="co-vat"
          className={styles.input}
          placeholder="e.g. 4110203456"
          value={value.vat ?? ""}
          onChange={(e) => update("vat", e.target.value)}
        />
      </div>
      <AddressFields
        label="Business address"
        idPrefix="co-addr"
        value={value.address}
        onChange={(addr) => update("address", addr)}
      />
    </div>
  );
}
