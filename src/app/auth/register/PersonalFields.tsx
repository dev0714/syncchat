import styles from "../auth.module.css";
import AddressFields from "./AddressFields";
import type { PersonalRegistrationData } from "@/types";

const HEAR_ABOUT_OPTIONS = ["Google", "Social media", "Friend / referral", "Other"] as const;
const USE_CASE_OPTIONS   = ["Personal projects", "Freelancing", "Side business", "Other"] as const;

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
        <label htmlFor="pe-phone" className={styles.label}>Phone number</label>
        <input
          id="pe-phone"
          className={styles.input}
          type="tel"
          placeholder="+27 82 000 0000"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
      </div>
      <div className={`${styles.field} ${styles.fieldSpan2}`}>
        <label htmlFor="pe-id" className={styles.label}>ID number</label>
        <input
          id="pe-id"
          className={styles.input}
          placeholder="13-digit SA ID number"
          value={value.id_number}
          onChange={(e) => update("id_number", e.target.value)}
          required
          maxLength={13}
          pattern="\d{13}"
          title="13-digit South African ID number"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="pe-hear" className={styles.label}>How did you hear about us?</label>
        <select
          id="pe-hear"
          className={styles.select}
          value={value.hear_about}
          onChange={(e) => update("hear_about", e.target.value as PersonalRegistrationData["hear_about"])}
          required
        >
          <option value="" disabled>Select one</option>
          {HEAR_ABOUT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="pe-use" className={styles.label}>What will you use SyncChat for?</label>
        <select
          id="pe-use"
          className={styles.select}
          value={value.use_case}
          onChange={(e) => update("use_case", e.target.value as PersonalRegistrationData["use_case"])}
          required
        >
          <option value="" disabled>Select one</option>
          {USE_CASE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <AddressFields
        label="Home address"
        idPrefix="pe-addr"
        value={value.address}
        onChange={(addr) => update("address", addr)}
      />
    </div>
  );
}
