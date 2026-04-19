'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div style={{ background: '#ffffff', color: '#1e293b' }}>
      <Navbar />

      {/* ── ABOUT HERO ── */}
      <div className="about-hero">
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
<h1>Built for South African Businesses</h1>
          <p style={{ maxWidth: '580px', marginTop: 0 }}>SyncChat was born from a simple belief: WhatsApp is the most powerful business communication channel in South Africa — and it deserves a proper platform.</p>
        </div>
      </div>

      {/* ── MISSION ── */}
      <section>
        <div className="section-inner">
          <div className="about-mission-grid">
            <div>
              <div className="section-label">Our Mission</div>
              <h2 className="section-title" style={{ fontSize: '2rem' }}>WhatsApp, but make it business</h2>
              <p style={{ color: 'var(--slate-500)', marginBottom: '20px' }}>South African businesses run on WhatsApp. Customers expect instant replies. Teams need structure. Automation is the only way to scale.</p>
              <p style={{ color: 'var(--slate-500)', marginBottom: '20px' }}>SyncChat gives growing businesses the tools that enterprise brands have — AI-powered automation, team workflows, and campaign management — all through the channel your customers already use every day.</p>
              <div className="about-stats-grid">
                <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '20px', border: '1.5px solid #bbf7d0' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green-mid)' }}>10k+</div>
                  <div style={{ fontSize: '14px', color: 'var(--slate-600)', marginTop: '4px' }}>Messages processed daily</div>
                </div>
                <div style={{ background: '#ede9fe', borderRadius: '14px', padding: '20px', border: '1.5px solid #c4b5fd' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7c3aed' }}>99.9%</div>
                  <div style={{ fontSize: '14px', color: 'var(--slate-600)', marginTop: '4px' }}>Platform uptime</div>
                </div>
                <div style={{ background: '#fef9c3', borderRadius: '14px', padding: '20px', border: '1.5px solid #fde047' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ca8a04' }}>24/7</div>
                  <div style={{ fontSize: '14px', color: 'var(--slate-600)', marginTop: '4px' }}>AI availability</div>
                </div>
                <div style={{ background: '#f0f9ff', borderRadius: '14px', padding: '20px', border: '1.5px solid #bae6fd' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7' }}>&lt; 30s</div>
                  <div style={{ fontSize: '14px', color: 'var(--slate-600)', marginTop: '4px' }}>Avg AI response time</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'white', border: '1.5px solid var(--slate-200)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '42px', height: '42px', background: '#dcfce7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>AI that actually understands context</div>
                    <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>Our agent builder lets you define exact behaviour, guardrails and personality — not just a generic chatbot.</div>
                  </div>
                </div>
                <div style={{ background: 'white', border: '1.5px solid var(--slate-200)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '42px', height: '42px', background: '#ede9fe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Built for teams, not lone wolves</div>
                    <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>Invite your whole team with proper roles. Admins, agents, and viewers all have the right access — nothing more.</div>
                  </div>
                </div>
                <div style={{ background: 'white', border: '1.5px solid var(--slate-200)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '42px', height: '42px', background: '#fce7f3', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Pricing that scales with you</div>
                    <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>Pay only for the AI conversations you use. Upgrade or downgrade your tier at any time with no penalties.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ background: 'var(--slate-50)' }}>
        <div className="section-inner">
          <div className="section-head">
            <div className="section-label">What We Stand For</div>
            <h2 className="section-title">Our values</h2>
          </div>
          <div className="about-values-grid">
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1.5px solid var(--slate-200)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '14px' }}>⚡</div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Speed First</h3>
              <p style={{ fontSize: '14px', color: 'var(--slate-500)' }}>Every second a customer waits is a second they might leave. Our infrastructure is built for sub-30-second AI responses, always.</p>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1.5px solid var(--slate-200)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '14px' }}>🔒</div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Secure by Design</h3>
              <p style={{ fontSize: '14px', color: 'var(--slate-500)' }}>WhatsApp credentials and customer data are protected with role-based access. Super admins manage credentials — no one else sees them.</p>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1.5px solid var(--slate-200)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '14px' }}>🌍</div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Local by Default</h3>
              <p style={{ fontSize: '14px', color: 'var(--slate-500)' }}>Built and priced for South African businesses. We understand load-shedding, Rand pricing, and the nuances of local customer communication.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section>
        <div className="section-inner">
          <div className="contact-grid">
            <div className="contact-info">
              <div className="section-label">Get in Touch</div>
              <h2>We&apos;d love to hear from you</h2>
              <p>Have a question about SyncChat? Want to request a demo, discuss a custom plan, or just say hi? Drop us a message.</p>

              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div><h4>Email</h4><p>hello@syncchat.co.za</p></div>
              </div>

              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div><h4>WhatsApp (of course)</h4><p>+27 10 123 4567</p></div>
              </div>

              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
                  </svg>
                </div>
                <div><h4>Location</h4><p>South Africa 🇿🇦</p></div>
              </div>

              <div className="contact-item">
                <div className="contact-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div><h4>Support Hours</h4><p>Mon–Fri 8:00–18:00 SAST</p></div>
              </div>
            </div>

            <div className="contact-form">
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--slate-900)' }}>Send us a message</h3>
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First name</label>
                      <input id="firstName" type="text" placeholder="Thabo" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last name</label>
                      <input id="lastName" type="text" placeholder="Mokoena" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email address</label>
                    <input id="email" type="email" placeholder="thabo@company.co.za" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input id="company" type="text" placeholder="Your business name" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="topic">What can we help you with?</label>
                    <select id="topic">
                      <option value="">Select a topic</option>
                      <option>Product demo</option>
                      <option>Pricing &amp; plans</option>
                      <option>Technical support</option>
                      <option>Custom enterprise plan</option>
                      <option>Partnership</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" placeholder="Tell us more about what you're looking for..." />
                  </div>
                  <button type="submit" className="btn btn-cta" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send Message
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--slate-900)' }}>Message sent!</h3>
                  <p style={{ fontSize: '14px', color: 'var(--slate-500)' }}>We&apos;ll get back to you within one business day.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2>Or just start for free</h2>
        <p>No need to wait for a sales call. Sign up and explore SyncChat yourself — setup takes less than 5 minutes.</p>
        <div className="cta-btns">
          <Link href="/auth/login" className="btn btn-white btn-lg">Create Free Account →</Link>
          <Link href="/pricing" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1.5px solid rgba(255,255,255,.35)' }}>See Pricing</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
