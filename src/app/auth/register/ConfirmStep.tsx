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

function Row({ label, value }: { label: string; value?: string }) {
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
            <Row label="Website"  value={data.website} />
            <Row label="VAT"      value={data.vat} />
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
          <span className={styles.confirmValue} style={{ whiteSpace: "pre-line" }}>
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
          <p>You may not use SyncChat to send spam, unsolicited bulk messages, illegal content, or messages that violate WhatsApp&apos;s Terms of Service. Violations may result in immediate account suspension.</p>
          <h4>3. Trial period</h4>
          <p>New accounts receive a 14-day free trial. At the end of the trial period a paid subscription is required to continue using the platform.</p>
          <h4>4. Subscriptions &amp; billing</h4>
          <p>Subscriptions are billed in ZAR. You may cancel at any time; access continues until the end of the current billing period. No refunds are issued for partial periods.</p>
          <h4>5. Data &amp; privacy</h4>
          <p>We store message metadata and account information necessary to operate the service. We do not sell your data. Message content may be stored temporarily for delivery purposes and is subject to our Privacy Policy.</p>
          <h4>6. WhatsApp compliance</h4>
          <p>Your use of SyncChat is subject to WhatsApp&apos;s Business Policy. You are responsible for ensuring your messaging activity complies with applicable laws, including POPIA (South Africa).</p>
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
