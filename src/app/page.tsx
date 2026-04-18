import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import HeroScroll from '@/components/marketing/HeroScroll';

export const metadata: Metadata = {
  title: 'SyncChat — WhatsApp CRM & AI Automation Platform',
  description: 'Turn WhatsApp into your most powerful business tool. AI-driven conversations, bulk messaging, team collaboration and automation — all in one platform.',
};

export default function HomePage() {
  return (
    <div style={{ background: '#ffffff', color: '#1e293b' }}>
      <Navbar />

      {/* ── SCROLL-DRIVEN HERO ── */}
      <HeroScroll />

      {/* ── LOGOS / TRUST ── */}
      <section style={{ padding: '40px 5vw', background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--slate-400)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '28px' }}>Trusted by South African businesses</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '48px', flexWrap: 'wrap', opacity: 0.45, filter: 'grayscale(1)' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#334155' }}>Acme Retail</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#334155' }}>FreshMart</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#334155' }}>SwiftCourier</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#334155' }}>ProAdvice</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#334155' }}>NovaTech</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section>
        <div className="section-inner">
          <div className="section-head">
            <div className="section-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              Everything You Need
            </div>
            <h2 className="section-title">One platform. Endless conversations.</h2>
            <p className="section-sub">From AI automation to team collaboration, SyncChat gives your business everything it needs to scale on WhatsApp.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#dcfce7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>WhatsApp Messaging</h3>
              <p>Send and receive messages from a fully managed WhatsApp Business number. No phone, no complexity.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#ede9fe' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3>AI-Powered Flows</h3>
              <p>Build AI agents with custom roles, guardrails, and tone. They handle conversations autonomously — day or night.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#fef9c3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Team Collaboration</h3>
              <p>Add up to 10 agents with role-based access. Assign conversations, track activity, and work as one team.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#fce7f3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3>Message Templates</h3>
              <p>Create reusable templates with dynamic variables. Send personalised bulk campaigns to thousands of contacts.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#e0f2fe' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <h3>Contact Management</h3>
              <p>Import contacts from CSV, organise by tags, and track full conversation history per contact.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#dcfce7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>Live Dashboard</h3>
              <p>Real-time stats on messages, contacts, and conversations. Know exactly what&apos;s happening at all times.</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link href="/features" className="btn btn-outline">See all features →</Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-bg">
        <div className="section-inner">
          <div className="section-head">
            <div className="section-label">Simple Setup</div>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-sub">No technical skills required. Connect your WhatsApp number and start automating today.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <h3>Create your account</h3>
              <p>Sign up free and set up your organisation in under 2 minutes.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>Connect WhatsApp</h3>
              <p>Scan the QR code to link your WhatsApp Business number instantly.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Build your AI agent</h3>
              <p>Define your agent&apos;s role, guardrails and tone — then activate.</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <h3>Watch it work</h3>
              <p>Your AI handles conversations 24/7 while you focus on the business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <div className="stats-banner">
        <div className="stats-grid">
          <div className="stat-item"><div className="stat-num">R1,500</div><div className="stat-lbl">Platform from / month</div></div>
          <div className="stat-item"><div className="stat-num">5,000+</div><div className="stat-lbl">AI conversations / month</div></div>
          <div className="stat-item"><div className="stat-num">10</div><div className="stat-lbl">Team members included</div></div>
          <div className="stat-item"><div className="stat-num">24/7</div><div className="stat-lbl">AI availability</div></div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-bg">
        <div className="section-inner">
          <div className="section-head">
            <div className="section-label">Customer Stories</div>
            <h2 className="section-title">Businesses love SyncChat</h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial">
              <div className="stars">★★★★★</div>
              <p>&ldquo;We went from manually replying to hundreds of WhatsApp messages to fully automated customer support in a single weekend. The AI flow builder is remarkable.&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: 'var(--green-mid)' }}>TM</div>
                <div><div className="author-name">Thabo Mokoena</div><div className="author-role">CEO, SwiftCourier SA</div></div>
              </div>
            </div>
            <div className="testimonial">
              <div className="stars">★★★★★</div>
              <p>&ldquo;The bulk messaging feature alone saves our marketing team 10 hours a week. Sending personalised campaigns to 3,000 clients takes under 5 minutes now.&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: '#7c3aed' }}>PS</div>
                <div><div className="author-name">Priya Sharma</div><div className="author-role">Marketing Manager, FreshMart</div></div>
              </div>
            </div>
            <div className="testimonial">
              <div className="stars">★★★★★</div>
              <p>&ldquo;Our AI agent handles 80% of support queries without any human involvement. Response time went from 4 hours to under 30 seconds. Customers are amazed.&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: '#0284c7' }}>NV</div>
                <div><div className="author-name">Nadia van der Berg</div><div className="author-role">Operations Lead, NovaTech</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2>Ready to automate your WhatsApp?</h2>
        <p>Join businesses already using SyncChat to save time, delight customers, and scale their WhatsApp operations effortlessly.</p>
        <div className="cta-btns">
          <Link href="/auth/login" className="btn btn-white btn-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            Get Started Free
          </Link>
          <Link href="/pricing" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1.5px solid rgba(255,255,255,.35)' }}>
            View Pricing
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
