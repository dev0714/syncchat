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
  idPrefix?: string;
}

export default function AddressFields({ label, value, onChange, idPrefix = "addr" }: Props) {
  function update(field: keyof SAAddress, v: string) {
    onChange({ ...value, [field]: v });
  }

  return (
    <div className={`${styles.addressSection} ${styles.fieldSpan2}`}>
      <p className={styles.addressLabel}>{label}</p>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-unit`} className={styles.label}>Unit / {label.includes("Home") ? "Flat" : "Building"} number</label>
          <input
            id={`${idPrefix}-unit`}
            className={styles.input}
            placeholder="Optional"
            value={value.unit ?? ""}
            onChange={(e) => update("unit", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-street`} className={styles.label}>Street number &amp; name</label>
          <input
            id={`${idPrefix}-street`}
            className={styles.input}
            placeholder="e.g. 123 Main Street"
            value={value.street}
            onChange={(e) => update("street", e.target.value)}
            required
          />
        </div>
        <div className={`${styles.field} ${styles.fieldSpan2}`}>
          <label htmlFor={`${idPrefix}-suburb`} className={styles.label}>Suburb</label>
          <input
            id={`${idPrefix}-suburb`}
            className={styles.input}
            placeholder="e.g. Sandton"
            value={value.suburb}
            onChange={(e) => update("suburb", e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-city`} className={styles.label}>City / Town</label>
          <input
            id={`${idPrefix}-city`}
            className={styles.input}
            placeholder="e.g. Johannesburg"
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${idPrefix}-postal_code`} className={styles.label}>Postal code</label>
          <input
            id={`${idPrefix}-postal_code`}
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
          <label htmlFor={`${idPrefix}-province`} className={styles.label}>Province</label>
          <select
            id={`${idPrefix}-province`}
            className={styles.select}
            value={value.province}
            onChange={(e) => update("province", e.target.value as SAAddress["province"])}
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
