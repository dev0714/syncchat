import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

export const metadata: Metadata = {
  title: 'Features — SyncChat',
  description: 'Explore every SyncChat feature: AI flows, bulk messaging, team management, templates and more.',
};

export default function FeaturesPage() {
  return (
    <div style={{ background: '#ffffff', color: '#1e293b' }}>
      <Navbar />

      {/* ── PAGE HERO ── */}
      <div className="page-hero">
        <div className="breadcrumb"><Link href="/">Home</Link> / Features</div>
        <h1>Everything SyncChat Can Do</h1>
        <p>A complete WhatsApp business platform — built for teams that want to move fast and automate smarter.</p>
      </div>

      {/* ── FEATURE 1: AI FLOWS ── */}
      <section>
        <div className="section-inner">
          <div className="feature-detail-grid">
            <div className="feature-detail-img">
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', borderRadius: '16px', padding: '28px', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#7c3aed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>AI Agent — Customer Support</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255,255,255,.15)' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '5px' }}>Role</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.9)' }}>You are a helpful support agent for Acme Corp. Answer questions, resolve issues, and escalate when needed.</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255,255,255,.15)' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '5px' }}>Guardrails</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.9)' }}>Never share pricing without approval. Do not discuss competitors.</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255,255,255,.15)' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '5px' }}>Tone</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.9)' }}>Friendly, concise, professional. Use customer&apos;s first name.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ background: 'rgba(124,58,237,.4)', border: '1px solid rgba(124,58,237,.6)', color: 'white', fontSize: '11px', padding: '4px 10px', borderRadius: '50px' }}>Web Search</span>
                    <span style={{ background: 'rgba(124,58,237,.4)', border: '1px solid rgba(124,58,237,.6)', color: 'white', fontSize: '11px', padding: '4px 10px', borderRadius: '50px' }}>CRM Lookup</span>
                    <span style={{ background: 'rgba(124,58,237,.4)', border: '1px solid rgba(124,58,237,.6)', color: 'white', fontSize: '11px', padding: '4px 10px', borderRadius: '50px' }}>Create Ticket</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-detail-content">
              <h2>AI Flows &amp; Agent Builder</h2>
              <p>Build intelligent AI agents that handle WhatsApp conversations on your behalf — around the clock, with no human required.</p>
              <ul className="feature-bullets">
                <li><div className="bullet-icon">✓</div><span>Define the agent&apos;s <strong>Role</strong>, <strong>Guardrails</strong>, <strong>Tone</strong> and <strong>Business Context</strong> in plain English</span></li>
                <li><div className="bullet-icon">✓</div><span>Choose which <strong>tools</strong> the agent can use: web search, CRM lookup, ticket creation and more</span></li>
                <li><div className="bullet-icon">✓</div><span>Trigger flows on incoming messages, specific <strong>keywords</strong>, new contacts, or a schedule</span></li>
                <li><div className="bullet-icon">✓</div><span>Link each flow to a specific <strong>WhatsApp instance</strong> for multi-number management</span></li>
                <li><div className="bullet-icon">✓</div><span>Prompt config is passed to your automation layer at runtime — no code required</span></li>
              </ul>
              <Link href="/auth/login" className="btn btn-cta" style={{ marginTop: '8px' }}>Build your first flow →</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── FEATURE 2: BULK MESSAGING ── */}
      <section style={{ background: 'var(--slate-50)' }}>
        <div className="section-inner">
          <div className="feature-detail-grid reverse">
            <div className="feature-detail-content">
              <h2>Bulk WhatsApp Campaigns</h2>
              <p>Send personalised WhatsApp messages to your entire contact list in minutes. Each message is dynamically filled with the recipient&apos;s details.</p>
              <ul className="feature-bullets">
                <li><div className="bullet-icon">✓</div><span>Select any <strong>message template</strong> with <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>{'{{name}}'}</code>, <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>{'{{phone}}'}</code>, or custom variables</span></li>
                <li><div className="bullet-icon">✓</div><span>Choose which contacts to include — or select all with one click</span></li>
                <li><div className="bullet-icon">✓</div><span>Preview the personalised message for the first 3 recipients before sending</span></li>
                <li><div className="bullet-icon">✓</div><span>Messages are sent in batches with a <strong>live progress bar</strong></span></li>
                <li><div className="bullet-icon">✓</div><span>Full send report: delivered, failed, and any errors per contact</span></li>
              </ul>
              <Link href="/auth/login" className="btn btn-cta" style={{ marginTop: '8px' }}>Start a campaign →</Link>
            </div>
            <div className="feature-detail-img">
              <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Bulk Send · Step 3 of 3</span>
                  <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '50px', fontWeight: 600 }}>Preview</span>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>Recipients (3 of 247)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '8px', padding: '8px 12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Sarah K.</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>+27 82 123 4567</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '8px', padding: '8px 12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Thabo M.</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>+27 71 987 6543</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#e5ddd5', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                    <div style={{ background: '#dcf8c6', borderRadius: '10px', borderBottomRightRadius: '3px', padding: '10px 12px', fontSize: '13px', color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,.1)' }}>
                      Hi Sarah! 🎉 Your exclusive offer is ready. Use code <strong>SAVE20</strong> for 20% off your next order. Valid until Sunday!
                      <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right', marginTop: '4px' }}>09:15 ✓✓</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#25d366', borderRadius: '3px' }} />
                    <div style={{ flex: 1, height: '6px', background: '#25d366', borderRadius: '3px' }} />
                    <div style={{ flex: 1, height: '6px', background: '#25d366', borderRadius: '3px' }} />
                    <div style={{ flex: 0.4, height: '6px', background: '#e2e8f0', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>247 sent · 3 failed · 74% complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── FEATURE 3: CONTACTS ── */}
      <section>
        <div className="section-inner">
          <div className="feature-detail-grid">
            <div className="feature-detail-img">
              <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Contacts · 2,847</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '50px' }}>+ Import CSV</span>
                    <span style={{ background: '#075e54', color: 'white', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '50px' }}>+ Add Contact</span>
                  </div>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '8px 0', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid #f1f5f9' }}>
                    <span>Name</span><span>Phone</span><span>Tags</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px 0', fontSize: '13px', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Sarah Khumalo</span>
                    <span style={{ color: '#64748b' }}>+27 82 123 4567</span>
                    <span><span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', padding: '2px 7px', borderRadius: '50px' }}>VIP</span></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px 0', fontSize: '13px', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Thabo Mokoena</span>
                    <span style={{ color: '#64748b' }}>+27 71 987 6543</span>
                    <span><span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '10px', padding: '2px 7px', borderRadius: '50px' }}>Lead</span></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px 0', fontSize: '13px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Nadia van Berg</span>
                    <span style={{ color: '#64748b' }}>+27 83 555 1234</span>
                    <span><span style={{ background: '#fce7f3', color: '#be185d', fontSize: '10px', padding: '2px 7px', borderRadius: '50px' }}>Customer</span></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-detail-content">
              <h2>Smart Contact Management</h2>
              <p>Keep all your WhatsApp contacts organised, searchable, and ready for campaigns — whether you have 10 or 10,000.</p>
              <ul className="feature-bullets">
                <li><div className="bullet-icon">✓</div><span>Import thousands of contacts at once via <strong>CSV upload</strong> with automatic field mapping</span></li>
                <li><div className="bullet-icon">✓</div><span>Tag contacts for segmentation — use tags to target specific groups in bulk campaigns</span></li>
                <li><div className="bullet-icon">✓</div><span>Full conversation history per contact — see every message ever sent or received</span></li>
                <li><div className="bullet-icon">✓</div><span>Search, filter, and edit contact details in seconds</span></li>
              </ul>
              <Link href="/auth/login" className="btn btn-cta" style={{ marginTop: '8px' }}>Import contacts →</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── FEATURE 4: TEAM ── */}
      <section style={{ background: 'var(--slate-50)' }}>
        <div className="section-inner">
          <div className="feature-detail-grid reverse">
            <div className="feature-detail-content">
              <h2>Role-Based Team Access</h2>
              <p>Invite your team and control exactly what each person can see and do inside SyncChat.</p>
              <ul className="feature-bullets">
                <li><div className="bullet-icon">✓</div><span>Up to <strong>10 team members</strong> included on every plan</span></li>
                <li><div className="bullet-icon">✓</div><span><strong>4 role levels</strong>: Super Admin, Org Admin, Agent, Viewer</span></li>
                <li><div className="bullet-icon">✓</div><span>Agents see only assigned conversations; admins see everything</span></li>
                <li><div className="bullet-icon">✓</div><span>Super Admins manage WhatsApp instance credentials — kept hidden from org members</span></li>
              </ul>
              <Link href="/auth/login" className="btn btn-cta" style={{ marginTop: '8px' }}>Invite your team →</Link>
            </div>
            <div className="feature-detail-img">
              <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Team Members</span>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f0fdf4', borderRadius: '10px', border: '1.5px solid #bbf7d0' }}>
                    <div style={{ width: '36px', height: '36px', background: '#075e54', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>SA</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Andre D.</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Super Admin</div>
                    </div>
                    <span style={{ background: '#075e54', color: 'white', fontSize: '10px', padding: '3px 9px', borderRadius: '50px', fontWeight: 600 }}>SUPER</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                    <div style={{ width: '36px', height: '36px', background: '#25d366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>TM</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Thabo M.</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Org Admin</div>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', padding: '3px 9px', borderRadius: '50px', fontWeight: 600 }}>ADMIN</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                    <div style={{ width: '36px', height: '36px', background: '#7c3aed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>PS</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Priya S.</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Agent</div>
                    </div>
                    <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '10px', padding: '3px 9px', borderRadius: '50px', fontWeight: 600 }}>AGENT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALL FEATURES GRID ── */}
      <section style={{ background: '#f0fdf4' }}>
        <div className="section-inner">
          <div className="section-head">
            <div className="section-label">Full Feature List</div>
            <h2 className="section-title">Everything included</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card"><div className="feature-icon" style={{ background: '#dcfce7' }}><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div><h3>WhatsApp Messaging</h3><p>Full two-way messaging with read receipts, media support, and conversation threading.</p></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: '#ede9fe' }}><svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg></div><h3>AI Agent Flows</h3><p>Multi-step prompt builder with roles, guardrails, tone and selectable tools.</p></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: '#fce7f3' }}><svg viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div><h3>Message Templates</h3><p>Dynamic templates with variables for name, phone, email and custom fields.</p></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: '#fef9c3' }}><svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg></div><h3>Bulk Campaigns</h3><p>Send to thousands with personalisation, progress tracking and delivery reports.</p></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: '#e0f2fe' }}><svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div><h3>Live Dashboard</h3><p>Real-time metrics, instance status, connected agents and message activity at a glance.</p></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: '#dcfce7' }}><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg></div><h3>Multi-Instance</h3><p>Manage multiple WhatsApp numbers from a single dashboard. QR scan to connect.</p></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: '#ede9fe' }}><svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div><h3>Team Roles</h3><p>Granular role-based access control for super admins, admins, agents and viewers.</p></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: '#fce7f3' }}><svg viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div><h3>Conversations</h3><p>Full inbox with threaded conversations, contact history, and message status tracking.</p></div>
            <div className="feature-card"><div className="feature-icon" style={{ background: '#fef9c3' }}><svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M4.93 4.93a10 10 0 0 0 0 14.14" /></svg></div><h3>Real-Time Sync</h3><p>All messages sync instantly across your team — no refresh needed, no missed conversations.</p></div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2>Ready to get started?</h2>
        <p>Set up SyncChat in minutes and put your WhatsApp on autopilot today.</p>
        <div className="cta-btns">
          <Link href="/auth/login" className="btn btn-white btn-lg">Start Free →</Link>
          <Link href="/pricing" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1.5px solid rgba(255,255,255,.35)' }}>View Pricing</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
