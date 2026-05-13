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
            <p>You may not use SyncChat to send spam, unsolicited bulk messages, illegal content, or messages that violate WhatsApp&apos;s Terms of Service or Business Policy. You may not use the platform for phishing, fraud, harassment, or distribution of malware. Violations may result in immediate account suspension without refund.</p>
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
            <p>Your use of SyncChat is subject to WhatsApp&apos;s Business Policy and Terms of Service. You are solely responsible for ensuring your messaging activity complies with all applicable laws, including POPIA (South Africa), the Electronic Communications and Transactions Act (ECTA), and any applicable anti-spam legislation. SyncChat reserves the right to suspend accounts in breach of WhatsApp&apos;s policies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Limitation of liability</h2>
            <p>SyncChat is not liable for message delivery failures, WhatsApp service interruptions, data loss, or any losses resulting from account suspension due to policy violations. The platform is provided &quot;as is&quot; without warranty of uninterrupted availability. Our total liability to you shall not exceed the fees paid in the 3 months preceding the claim.</p>
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
