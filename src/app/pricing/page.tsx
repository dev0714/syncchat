'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

const TIERS = [
  { conv: 5000,  monthly: 2500 },
  { conv: 10000, monthly: 5000 },
  { conv: 15000, monthly: 7500 },
  { conv: 20000, monthly: 10000 },
];
const PLATFORM = 1500;

function fmt(n: number) { return 'R' + n.toLocaleString('en-ZA'); }

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentTier, setCurrentTier] = useState(0);

  const disc = isAnnual ? 0.8 : 1;
  const platM = Math.round(PLATFORM * disc);
  const aiM   = Math.round(TIERS[currentTier].monthly * disc);
  const total  = platM + aiM;

  const savingsMsg = isAnnual
    ? `🎉 You save ${fmt((PLATFORM + TIERS[currentTier].monthly) * 12 - total * 12)} per year on this plan`
    : null;

  return (
    <div style={{ background: '#ffffff', color: '#1e293b' }}>
      <Navbar />

      {/* ── PAGE HERO ── */}
      <div className="page-hero">
<h1>Simple, Transparent Pricing</h1>
        <p>Two components — Platform + AI. Pay only for what you use. No surprises.</p>
      </div>

      {/* ── PRICING SECTION ── */}
      <section>
        <div className="section-inner">

          {/* Billing toggle */}
          <div className="toggle-wrap">
            <span className={`toggle-label${!isAnnual ? ' active' : ''}`}>Monthly</span>
            <button
              className={`toggle-btn${isAnnual ? ' on' : ''}`}
              onClick={() => setIsAnnual(!isAnnual)}
              aria-label="Toggle billing period"
            >
              <div className="toggle-knob" />
            </button>
            <span className={`toggle-label${isAnnual ? ' active' : ''}`}>
              Annual <span className="save-badge">Save 20%</span>
            </span>
          </div>

          {/* Platform + AI cards */}
          <div className="pricing-cards-grid">

            {/* Platform */}
            <div className="pricing-card" style={{ borderColor: 'var(--green)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', background: '#dcfce7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div>
                  <div className="pricing-name">Platform</div>
                  <div className="pricing-desc" style={{ margin: 0 }}>WhatsApp CRM &amp; Team Collaboration</div>
                </div>
              </div>
              <div className="pricing-price">
                <div><span className="amount">{fmt(platM)}</span> <span className="period">/ month</span></div>
                {isAnnual && <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>{fmt(platM * 12)} billed annually</div>}
              </div>
              <ul className="pricing-features">
                <li><span className="check">✓</span> WhatsApp messaging</li>
                <li><span className="check">✓</span> Up to 10 team members</li>
                <li><span className="check">✓</span> Role-based access control</li>
                <li><span className="check">✓</span> Bulk messaging campaigns</li>
                <li><span className="check">✓</span> Message templates</li>
                <li><span className="check">✓</span> Contact management &amp; CSV import</li>
                <li><span className="check">✓</span> Conversation inbox</li>
                <li><span className="check">✓</span> Real-time dashboard</li>
                <li><span className="check">✓</span> Multi-instance support</li>
              </ul>
            </div>

            {/* AI Add-on */}
            <div className="ai-card featured">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#ede9fe', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                  <div>
                    <div className="pricing-name">AI Bot Add-on</div>
                    <div className="pricing-desc" style={{ margin: 0 }}>AI-Powered Conversations</div>
                  </div>
                </div>
                <span style={{ background: '#7c3aed', color: 'white', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '50px' }}>ADD-ON</span>
              </div>

              <div className="pricing-price">
                <div><span className="amount" style={{ color: '#7c3aed' }}>{fmt(aiM)}</span> <span className="period">/ month</span></div>
                <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>{TIERS[currentTier].conv.toLocaleString()} AI conversations / month</div>
              </div>

              {/* Slider */}
              <div style={{ margin: '20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--slate-400)', marginBottom: '4px' }}>
                  <span>Conversations / month</span>
                  <span style={{ fontWeight: 700, color: '#7c3aed' }}>{TIERS[currentTier].conv.toLocaleString()}</span>
                </div>
                <input
                  type="range" min="0" max="3" value={currentTier}
                  className="tier-slider"
                  onChange={e => setCurrentTier(parseInt(e.target.value))}
                />
                <div className="tier-btns">
                  {TIERS.map((t, i) => (
                    <div
                      key={i}
                      className={`tier-btn${currentTier === i ? ' active' : ''}`}
                      onClick={() => setCurrentTier(i)}
                    >
                      {t.conv >= 1000 ? `${t.conv / 1000}k` : t.conv}
                    </div>
                  ))}
                </div>
              </div>

              <ul className="pricing-features">
                <li><span className="check">✓</span> AI agent prompt builder</li>
                <li><span className="check">✓</span> Role, guardrails, tone &amp; context</li>
                <li><span className="check">✓</span> Selectable AI tools</li>
                <li><span className="check">✓</span> Keyword &amp; event triggers</li>
                <li><span className="check">✓</span> 24/7 automated responses</li>
                <li><span className="check">✓</span> Conversation count tracking</li>
              </ul>
            </div>
          </div>

          {/* Total box */}
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="total-box">
              <h3>Combined Total</h3>
              <div className="total-price">{fmt(total)} / mo</div>
              <div className="total-sub">Platform {fmt(platM)} + AI {TIERS[currentTier].conv.toLocaleString()} conv. {fmt(aiM)}</div>
              {savingsMsg && (
                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,.15)', borderRadius: '50px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, display: 'inline-block' }}>
                  {savingsMsg}
                </div>
              )}
              <Link href="/auth/login" className="btn btn-white btn-lg" style={{ marginTop: '24px', display: 'inline-flex' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                Get Started — {fmt(total)} / month
              </Link>
              <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '12px' }}>Secure payment · Cancel anytime · VAT may apply</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ background: 'var(--slate-50)' }}>
        <div className="section-inner">
          <div className="section-head">
            <div className="section-label">Compare</div>
            <h2 className="section-title">What&apos;s included</h2>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1.5px solid var(--slate-200)', background: 'white' }}>
            <table className="compare-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Feature</th>
                  <th>Platform</th>
                  <th>AI Add-on</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>WhatsApp messaging</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>Team members (up to 10)</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>Role-based access control</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>Contact management &amp; CSV import</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>Message templates</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>Bulk campaign sending</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>Conversation inbox</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>Real-time dashboard &amp; stats</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>Multi-instance support</td><td><span className="check-icon">✓</span></td><td><span className="dash-icon">—</span></td></tr>
                <tr><td>AI agent builder (role, guardrails, tone)</td><td><span className="dash-icon">—</span></td><td><span className="check-icon">✓</span></td></tr>
                <tr><td>AI flows &amp; automation triggers</td><td><span className="dash-icon">—</span></td><td><span className="check-icon">✓</span></td></tr>
                <tr><td>Selectable AI tools</td><td><span className="dash-icon">—</span></td><td><span className="check-icon">✓</span></td></tr>
                <tr><td>AI conversations / month</td><td><span className="dash-icon">—</span></td><td>5k – 20k</td></tr>
                <tr><td>24/7 automated responses</td><td><span className="dash-icon">—</span></td><td><span className="check-icon">✓</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section>
        <div className="section-inner" style={{ maxWidth: '760px' }}>
          <div className="section-head">
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Common questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { q: 'What counts as an AI conversation?', a: 'A conversation is a single AI-handled WhatsApp thread within a 24-hour window. Human-agent replies do not count toward your AI usage.' },
              { q: 'Can I change my conversation tier?', a: 'Yes. You can upgrade or downgrade your AI tier at any time. Changes take effect at the start of your next billing period.' },
              { q: 'What happens if I exceed my conversation limit?', a: "You'll receive a notification and the AI bot will pause until you upgrade your tier or the next billing period begins. Your human team can still use the platform normally." },
              { q: 'Do I need the AI add-on?', a: 'No. The Platform plan gives you full WhatsApp messaging, team management, bulk sending and templates. The AI add-on is optional and adds automated, AI-powered conversation handling.' },
              { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards. EFT and invoicing available for annual plans on request.' },
            ].map((item, i, arr) => (
              <div key={i} style={{ padding: '24px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: 'var(--slate-900)' }}>{item.q}</h3>
                <p style={{ fontSize: '14px', color: 'var(--slate-500)' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2>Start automating today</h2>
        <p>No long-term contracts. Cancel anytime. Get your first AI-powered conversation flowing in minutes.</p>
        <div className="cta-btns">
          <Link href="/auth/login" className="btn btn-white btn-lg">Get Started →</Link>
          <Link href="/contact" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1.5px solid rgba(255,255,255,.35)' }}>Talk to Us</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
