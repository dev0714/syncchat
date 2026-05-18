'use client';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import HeroChatPhone from '@/components/marketing/HeroChatPhone';

const WavyDivider = () => (
  <div style={{width:'100%', height:1, background:'rgba(11,31,28,.14)'}} aria-hidden="true"/>
);

const LOGOS = ['Acme Sneakers','FreshMart','SwiftCourier','ProAdvice','NovaTech','LeadSync'];

const CAPS = [
  {
    tag:'01 · Answers',
    title:'It replies. In your tone.',
    desc:'Set the role, guardrails and voice once. The agent uses them on every message — friendly, professional, on-brand.',
    color:'#25D366',
    chat:[
      { in:'Whats your return policy?' },
      { out:"Hey! 30-day returns on unworn items, full refund. Need a return label? I can sort one right now." },
    ],
  },
  {
    tag:'02 · Looks things up',
    title:'It checks your systems.',
    desc:'Connected to your CRM, inventory, orders and scheduler via our workflow engine. Asks the right questions, then takes action.',
    color:'#6A4FB6',
    chat:[
      { in:"Where's my order #4821?" },
      { out:"It shipped yesterday with Aramex (tracking AR-90234), arriving Thursday. Want SMS updates?" },
    ],
  },
  {
    tag:'03 · Remembers',
    title:'It picks up where you left off.',
    desc:"20-message rolling memory per contact. The agent doesn't ask the customer to repeat themselves — ever.",
    color:'#F4B740',
    chat:[
      { in:"Hi again — about that hold from yesterday?" },
      { out:"Welcome back Sarah! Your Air Max in size 9 is still held at V&A until 6pm today. Coming through?" },
    ],
  },
  {
    tag:'04 · Hands off cleanly',
    title:'It knows when to call a human.',
    desc:"Hit a guardrail, an angry customer, or a question it can't answer? It pings your team and steps aside.",
    color:'#E0826E',
    chat:[
      { in:"This is the third time. I want to speak to a manager NOW." },
      { tool:'Escalate · Notify @Thabo on #support' },
      { out:"I understand — I've flagged this to Thabo (our ops lead). He'll be with you in under 3 minutes." },
    ],
  },
];

const USE_CASES = [
  {
    industry:'Retail & e-commerce',
    headline:'Order status, returns, restock alerts — all on WhatsApp.',
    metric:'82% support tickets auto-resolved',
    examples:['"Where\'s my order?"','"Do you have size 9?"','"How do I return this?"'],
  },
  {
    industry:'Local services',
    headline:'Bookings, reminders and quotes without picking up the phone.',
    metric:'3× more bookings on weekends',
    examples:['"Can I book for Friday 2pm?"','"What does cleaning cost?"','"Need to reschedule"'],
  },
  {
    industry:'Sales & lead gen',
    headline:'Qualify leads, send brochures, hand hot ones to your team.',
    metric:'< 30 sec response, every time',
    examples:['"Tell me more about pricing"','"Send me a brochure"','"Can we chat tomorrow?"'],
  },
];

const STEPS = [
  { n:'1', t:'Connect WhatsApp', d:'Scan a QR. Your existing WhatsApp Business number, no porting.', time:'30 sec' },
  { n:'2', t:'Write the prompt',  d:'Plain English: role, tone, guardrails. We give you a starter template.', time:'5 min' },
  { n:'3', t:'Plug in tools',     d:'Inventory, CRM, calendar, custom endpoints — our automation engine handles the glue.', time:'10 min' },
  { n:'4', t:'Go live',           d:'Toggle the agent on. Watch every conversation from the dashboard.', time:'instant' },
];

const FAQS = [
  { q:"Do my customers know they're talking to an AI?",
    a:'You decide. Most clients introduce the agent as "the automated assistant" — friendly, transparent, and customers love that it replies instantly. The agent can also hand off to a human at any time.' },
  { q:'Will it work with my existing WhatsApp Business number?',
    a:'Yes. We use the official WhatsApp Business API via UltraMSG — no number porting, no losing your contacts. Connect with a QR scan.' },
  { q:'Can the AI make mistakes?',
    a:'Guardrails stop it from quoting prices, making promises, or going off-topic without approval. Anything sensitive escalates to your team. You see every conversation in the dashboard.' },
  { q:'What tools can it connect to?',
    a:'Anything with an API — Supabase, Google Sheets, Notion, Calendly, custom endpoints, your CRM. Our workflow engine ships with 400+ pre-built integrations.' },
  { q:'How much does it cost?',
    a:'From R1,500/month for the platform. AI conversation pricing depends on volume — most clients spend $0.005–$0.02 per reply on the AI side.' },
];

type ChatMsg = { in?: string; out?: string; tool?: string };

function MiniChat({ chat, color }: { chat: ChatMsg[]; color: string }) {
  return (
    <div style={{
      background:'#ECE5DD', borderRadius:14, padding:12,
      display:'flex', flexDirection:'column', gap:6,
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='%23DDD2C3' fill-opacity='.35'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3Ccircle cx='40' cy='30' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
    }}>
      {chat.map((m, i) => {
        if (m.tool) return (
          <div key={i} style={{
            alignSelf:'center', background:'rgba(11,59,54,.92)', color:'#DCF8C6',
            fontFamily:"'JetBrains Mono'", fontSize:10, padding:'5px 9px', borderRadius:6,
            maxWidth:'85%', textAlign:'center', lineHeight:1.4,
            border:'1px solid rgba(37,211,102,.25)',
          }}>
            <span style={{color:'#25D366', fontWeight:700}}>⚡</span> {m.tool}
          </div>
        );
        const isIn = !!m.in;
        return (
          <div key={i} style={{
            alignSelf: isIn ? 'flex-start' : 'flex-end',
            background: isIn ? '#fff' : '#D9FDD3',
            padding:'7px 10px', borderRadius:10,
            borderBottomLeftRadius: isIn ? 3 : 10,
            borderBottomRightRadius: isIn ? 10 : 3,
            fontSize:12.5, lineHeight:1.4, maxWidth:'82%',
            boxShadow:'0 1px 1px rgba(0,0,0,.06)',
          }}>
            {m.in || m.out}
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const [faqOpen, setFaqOpen] = useState(0);

  return (
    <div style={{background:'var(--bg)'}}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{paddingTop:48, paddingBottom:64, position:'relative', overflow:'hidden'}}>
        <div className="hero-blobs" aria-hidden="true">
          <div className="blob blob-1"/>
          <div className="blob blob-2"/>
          <div className="blob blob-3"/>
          <div className="blob blob-4"/>
        </div>
        <div style={{
          position:'absolute', inset:0, opacity:.5, pointerEvents:'none',
          backgroundImage:`radial-gradient(rgba(11,59,54,.06) 1px, transparent 1px)`,
          backgroundSize:'24px 24px',
          maskImage:'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          WebkitMaskImage:'radial-gradient(ellipse at center, black 40%, transparent 75%)',
        }}/>

        <div className="wrap" style={{position:'relative', zIndex:1}}>
          <div style={{
            display:'grid', gridTemplateColumns:'1.05fr .95fr', gap:60, alignItems:'center',
          }} className="hero-grid">
            <div>
              <div className="chip" style={{marginBottom:24}}>
                <span className="pulse"/>
                AI-powered WhatsApp agent
              </div>
              <h1 style={{
                fontSize:'clamp(2.6rem, 5vw, 4.8rem)',
                marginBottom:24,
                letterSpacing:'-0.035em',
                color:'var(--ink)',
              }}>
                Your WhatsApp,<br/>
                <span style={{position:'relative', display:'inline-block'}}>
                  <span style={{
                    background:'linear-gradient(180deg, #25D366 0%, #128C7E 100%)',
                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                    backgroundClip:'text', color:'transparent',
                    fontStyle:'italic',
                  }}>answers itself.</span>
                  <svg viewBox="0 0 300 12" style={{position:'absolute', left:0, bottom:-6, width:'100%', height:12}} preserveAspectRatio="none">
                    <path d="M2 8 Q 80 2, 150 6 T 298 4" fill="none" stroke="#25D366" strokeWidth="3" strokeLinecap="round" opacity=".55"/>
                  </svg>
                </span>
              </h1>
              <p style={{
                fontSize:19, color:'var(--ink-soft)',
                maxWidth:520, marginBottom:36,
              }}>
                Syncchat plugs an AI agent into your WhatsApp Business number.
                It reads every message, looks things up in your systems, and replies in your tone — 24/7.
              </p>

              <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom:40}}>
                <Link href="/auth/login" className="btn btn-primary">
                  Start free <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/features" className="btn btn-ghost">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  See it work
                </Link>
              </div>

              <div style={{
                display:'flex', gap:0, borderTop:'1px solid var(--line)',
                paddingTop:24,
              }}>
                {[
                  ['< 30s', 'Avg reply time'],
                  ['24/7', 'Always answering'],
                  ['80%', 'Queries auto-resolved'],
                ].map(([n,l]) => (
                  <div key={l} style={{flex:1, paddingRight:16}}>
                    <div style={{fontSize:24, fontWeight:700, fontFamily:"'Bricolage Grotesque'", letterSpacing:'-0.02em'}}>{n}</div>
                    <div style={{fontSize:12, color:'var(--muted)', marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'center', alignItems:'center', position:'relative'}}>
              <HeroChatPhone/>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 900px){
            .hero-grid{ grid-template-columns: 1fr !important; gap: 40px !important;}
          }
        `}</style>
      </section>

      {/* ── LOGO STRIP ── */}
      <section style={{padding:'40px 0', background:'var(--paper)'}}>
        <div className="wrap" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap'}}>
          <div style={{fontSize:13, color:'var(--muted)', maxWidth:200, fontWeight:500}}>
            Trusted by SA businesses<br/>moving thousands of messages a day.
          </div>
          <div style={{display:'flex', gap:32, flexWrap:'wrap', justifyContent:'center', alignItems:'center', flex:1}}>
            {LOGOS.map(l => (
              <div key={l} style={{
                fontFamily:"'Bricolage Grotesque'", fontWeight:700, fontSize:16,
                color:'var(--ink)', opacity:.4, letterSpacing:'-0.01em',
              }}>{l}</div>
            ))}
          </div>
        </div>
      </section>

      <WavyDivider />

      {/* ── CAPABILITIES ── */}
      <section style={{background:'var(--bg)'}}>
        <div className="wrap">
          <div style={{maxWidth:680, marginBottom:64}}>
            <div className="eyebrow">What it can do</div>
            <h2 style={{fontSize:'clamp(2rem, 3.6vw, 3.4rem)', marginTop:12, color:'var(--ink)'}}>
              Not a chatbot. <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>An actual agent.</span>
            </h2>
            <p style={{fontSize:17, color:'var(--ink-soft)', marginTop:16}}>
              Most WhatsApp bots can answer FAQs. Syncchat agents can read context, look things up, take action, and know when to escalate.
            </p>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}} className="caps-grid">
            {CAPS.map(c => (
              <div key={c.tag} style={{
                background:'var(--paper)', border:'1px solid var(--line)',
                borderRadius:20, padding:28,
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:24,
                alignItems:'start',
              }} className="cap-card">
                <div>
                  <div style={{
                    fontFamily:"'JetBrains Mono'", fontSize:11, color:c.color,
                    fontWeight:600, marginBottom:14, letterSpacing:'.05em',
                  }}>{c.tag}</div>
                  <h3 style={{fontSize:24, color:'var(--ink)', letterSpacing:'-0.02em', marginBottom:12, lineHeight:1.15}}>
                    {c.title}
                  </h3>
                  <p style={{fontSize:14, color:'var(--ink-soft)', lineHeight:1.55}}>
                    {c.desc}
                  </p>
                </div>
                <MiniChat chat={c.chat} color={c.color}/>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 900px){
            .caps-grid{ grid-template-columns: 1fr !important; }
            .cap-card{ grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      <WavyDivider />

      {/* ── USE CASES ── */}
      <section style={{background:'var(--paper)'}}>
        <div className="wrap">
          <div style={{maxWidth:680, marginBottom:48}}>
            <div className="eyebrow">Built for the messy real world</div>
            <h2 style={{fontSize:'clamp(2rem, 3.6vw, 3.4rem)', marginTop:12, color:'var(--ink)'}}>
              Replaces 100s<br/>of repetitive replies.
            </h2>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:18}} className="uc-grid">
            {USE_CASES.map(u => (
              <div key={u.industry} style={{
                background:'var(--bg)', border:'1px solid var(--line)',
                borderRadius:18, padding:28,
                display:'flex', flexDirection:'column', gap:18,
                position:'relative', overflow:'hidden',
              }}>
                <div style={{fontSize:12, fontWeight:700, color:'var(--teal-mid)', letterSpacing:'.05em', textTransform:'uppercase'}}>
                  {u.industry}
                </div>
                <h3 style={{fontSize:22, color:'var(--ink)', lineHeight:1.18, letterSpacing:'-0.01em'}}>{u.headline}</h3>

                <div style={{display:'flex', flexDirection:'column', gap:6, marginTop:'auto'}}>
                  {u.examples.map((e,i) => (
                    <div key={i} style={{
                      background:'#fff', border:'1px solid var(--line)',
                      borderRadius:10, padding:'8px 12px',
                      fontSize:13, color:'var(--ink-soft)',
                      display:'flex', alignItems:'center', gap:8,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.4" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                      {e}
                    </div>
                  ))}
                </div>

                <div style={{
                  borderTop:'1px dashed var(--line)', paddingTop:14, marginTop:6,
                  fontSize:12.5, color:'var(--teal)', fontWeight:600,
                  display:'flex', alignItems:'center', gap:6,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  {u.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 900px){ .uc-grid{ grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      <WavyDivider />

      {/* ── SETUP ── */}
      <section style={{background:'var(--ink)', color:'#fff', position:'relative', overflow:'hidden'}}>
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`radial-gradient(circle at 80% 20%, rgba(37,211,102,.15), transparent 40%), radial-gradient(circle at 20% 80%, rgba(106,79,182,.12), transparent 40%)`,
          pointerEvents:'none',
        }}/>
        <div className="wrap" style={{position:'relative'}}>
          <div style={{maxWidth:680, marginBottom:56}}>
            <div className="eyebrow" style={{color:'#25D366'}}>Setup</div>
            <h2 style={{fontSize:'clamp(2rem, 3.6vw, 3.4rem)', marginTop:12, color:'#fff'}}>
              From signup to your first AI reply —<br/>
              <span style={{color:'#DCF8C6', fontStyle:'italic'}}>under 20 minutes.</span>
            </h2>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:0, position:'relative'}} className="setup-grid">
            {STEPS.map((s) => (
              <div key={s.n} style={{
                padding:'24px 24px 24px 0',
                borderLeft:'1px solid rgba(255,255,255,.12)',
                paddingLeft:24,
                position:'relative',
              }}>
                <div style={{
                  position:'absolute', left:-1, top:24, width:2, height:32,
                  background:'#25D366',
                }}/>
                <div style={{
                  fontFamily:"'JetBrains Mono'", fontSize:13, color:'#25D366', fontWeight:600,
                  marginBottom:14,
                }}>
                  STEP {s.n} / 4
                </div>
                <h3 style={{fontSize:22, color:'#fff', marginBottom:10, letterSpacing:'-0.01em'}}>{s.t}</h3>
                <p style={{fontSize:14, color:'rgba(255,255,255,.65)', lineHeight:1.6, marginBottom:14}}>{s.d}</p>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  fontSize:11, color:'rgba(255,255,255,.55)',
                  fontFamily:"'JetBrains Mono'",
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {s.time}
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 900px){ .setup-grid{ grid-template-columns: 1fr 1fr !important; } }
          @media (max-width: 540px){ .setup-grid{ grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      <WavyDivider />

      {/* ── FAQ ── */}
      <section style={{background:'var(--bg)'}}>
        <div className="wrap" style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:48}}>
          <div className="faq-head">
            <div className="eyebrow">FAQ</div>
            <h2 style={{fontSize:'clamp(2rem, 3.6vw, 3.4rem)', marginTop:12, color:'var(--ink)'}}>
              Questions<br/>worth asking.
            </h2>
            <p style={{fontSize:15, color:'var(--muted)', marginTop:18, maxWidth:340}}>
              Can&apos;t find what you need?{' '}
              <a href="https://wa.me/27825550123" style={{color:'var(--teal-mid)', textDecoration:'underline'}}>Chat with us on WhatsApp</a>
              {' '}— yes, the AI will answer first.
            </p>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:0}}>
            {FAQS.map((f, i) => (
              <div key={i} style={{
                borderTop:'1px solid var(--line)',
                borderBottom: i === FAQS.length-1 ? '1px solid var(--line)' : 'none',
              }}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    width:'100%', padding:'22px 0', textAlign:'left',
                    fontSize:18, fontWeight:600, color:'var(--ink)',
                    fontFamily:"'Plus Jakarta Sans'",
                    letterSpacing:'-0.005em',
                  }}
                >
                  {f.q}
                  <span style={{
                    width:28, height:28, borderRadius:'50%',
                    background: faqOpen === i ? 'var(--ink)' : 'var(--paper)',
                    color: faqOpen === i ? '#fff' : 'var(--ink)',
                    border:'1px solid var(--line)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, transition:'all .2s',
                    flexShrink:0,
                  }}>
                    {faqOpen === i ? '−' : '+'}
                  </span>
                </button>
                {faqOpen === i && (
                  <div style={{paddingBottom:22, fontSize:15, color:'var(--ink-soft)', lineHeight:1.65, maxWidth:560}}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 900px){
            .faq-head{ grid-column: 1 / -1; }
            .wrap > div[style*="grid-template-columns"]{ grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      <WavyDivider />

      {/* ── CTA ── */}
      <section id="cta" style={{background:'var(--paper)'}}>
        <div className="wrap">
          <div style={{
            background:'linear-gradient(140deg, #075E54 0%, #0B3B36 60%, #0B1F1C 100%)',
            borderRadius:24, padding:'72px 56px',
            display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:48, alignItems:'center',
            position:'relative', overflow:'hidden',
          }} className="cta-grid">
            <div style={{
              position:'absolute', right:-40, top:-40, width:240, height:240,
              background:'radial-gradient(circle, rgba(37,211,102,.25), transparent 70%)',
              filter:'blur(20px)',
            }}/>

            <div style={{position:'relative'}}>
              <h2 style={{fontSize:'clamp(2rem, 3.6vw, 3.4rem)', color:'#fff', letterSpacing:'-0.025em', marginBottom:16, lineHeight:1.08}}>
                Let your WhatsApp<br/>
                <span style={{color:'#25D366', fontStyle:'italic'}}>do its own job.</span>
              </h2>
              <p style={{fontSize:17, color:'rgba(255,255,255,.78)', maxWidth:480, marginBottom:32}}>
                Free for 14 days. No credit card. Connect your WhatsApp number and watch your first AI reply happen in under 20 minutes.
              </p>
              <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                <Link href="/auth/login" className="btn btn-green" style={{padding:'16px 26px', fontSize:16}}>
                  Start free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/contact" className="btn" style={{
                  padding:'16px 26px', fontSize:16,
                  background:'rgba(255,255,255,.1)', color:'#fff',
                  border:'1px solid rgba(255,255,255,.18)',
                }}>
                  Book a demo
                </Link>
              </div>
              <div style={{display:'flex', gap:24, marginTop:32, fontSize:13, color:'rgba(255,255,255,.55)'}}>
                {['14-day free trial','No credit card','Cancel anytime'].map(t => (
                  <span key={t} style={{display:'flex', alignItems:'center', gap:6}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.4" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{position:'relative'}}>
              <div style={{
                background:'#ECE5DD', borderRadius:18, padding:14,
                display:'flex', flexDirection:'column', gap:8,
                transform:'rotate(2deg)',
                boxShadow:'0 30px 60px -20px rgba(0,0,0,.3)',
              }}>
                <div style={{alignSelf:'flex-start', background:'#fff', padding:'8px 12px', borderRadius:12, borderBottomLeftRadius:4, fontSize:13, maxWidth:'85%'}}>Hey 👋 quick question about pricing</div>
                <div style={{alignSelf:'flex-end', background:'#D9FDD3', padding:'8px 12px', borderRadius:12, borderBottomRightRadius:4, fontSize:13, maxWidth:'85%'}}>Of course! What size business are you running? I&apos;ll point you at the right plan.</div>
                <div style={{alignSelf:'flex-start', background:'#fff', padding:'8px 12px', borderRadius:12, borderBottomLeftRadius:4, fontSize:13, maxWidth:'85%'}}>Around 800 messages a day</div>
                <div style={{alignSelf:'flex-end', background:'#D9FDD3', padding:'8px 12px', borderRadius:12, borderBottomRightRadius:4, fontSize:13, maxWidth:'90%'}}>Perfect — Growth plan covers you. Want me to set up your trial right now? 🚀</div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 900px){
            .cta-grid{ grid-template-columns: 1fr !important; padding: 48px 28px !important;}
          }
        `}</style>
      </section>

      <Footer />
    </div>
  );
}
