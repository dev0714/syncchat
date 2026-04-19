'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────
   Panel helper – fades/slides based on active index
───────────────────────────────────────────────────────────── */
function Panel({
  active,
  prev,
  children,
}: {
  active: boolean;
  prev: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: active ? 1 : 0,
        transform: active
          ? 'translateY(0) scale(1)'
          : prev
          ? 'translateY(-28px) scale(0.97)'
          : 'translateY(28px) scale(0.97)',
        transition: 'opacity 0.55s cubic-bezier(.4,0,.2,1), transform 0.55s cubic-bezier(.4,0,.2,1)',
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Phone screen helper
───────────────────────────────────────────────────────────── */
function PhoneScreen({ active, prev, children }: { active: boolean; prev: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: active ? 1 : 0,
        transform: active
          ? 'translateY(0)'
          : prev
          ? 'translateY(-16px)'
          : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        pointerEvents: active ? 'auto' : 'none',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Phone Screen Content
───────────────────────────────────────────────────────────── */

function ChatScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#e5ddd5' }}>
      <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <div className="msg msg-in">Hi! I need help with my order 🙏<div className="msg-time">09:42</div></div>
        <div className="msg msg-out">Hi Sarah! Of course — I can see order #4821. It shipped yesterday and arrives Thursday. 📦<div className="msg-time">09:42</div></div>
        <div className="msg msg-in">Amazing! Can I change the address?<div className="msg-time">09:43</div></div>
        <div className="msg msg-out">Absolutely! Address updated. You&apos;ll get a confirmation SMS shortly ✅<div className="msg-time">09:43</div></div>
        <div className="msg msg-in">You&apos;re incredible! 😍<div className="msg-time">09:43</div></div>
        <div className="msg-typing"><div className="dot" /><div className="dot" /><div className="dot" /></div>
      </div>
    </div>
  );
}

function CampaignScreen() {
  return (
    <div style={{ background: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Campaign header */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 14px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>📢 Black Friday Campaign</div>
        <div style={{ fontSize: '10px', color: '#64748b' }}>Sending to 3,000 contacts</div>
      </div>
      {/* Progress */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
          <span>2,247 sent</span>
          <span style={{ color: '#25D366' }}>74% complete</span>
        </div>
        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: '74%', height: '100%', background: 'linear-gradient(90deg, #25D366, #128C7E)', borderRadius: '3px', animation: 'none' }} />
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>3 failed · 750 remaining</div>
      </div>
      {/* Messages list */}
      <div style={{ flex: 1, overflowY: 'hidden', padding: '8px 0' }}>
        {[
          { name: 'Sarah K.', phone: '+27 82 123', status: '✓✓', color: '#25D366' },
          { name: 'Thabo M.', phone: '+27 71 987', status: '✓✓', color: '#25D366' },
          { name: 'Priya S.', phone: '+27 83 456', status: '✓✓', color: '#25D366' },
          { name: 'Nadia V.', phone: '+27 79 321', status: '⏳', color: '#94a3b8' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 14px', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
            <div style={{ width: '28px', height: '28px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#15803d', flexShrink: 0 }}>
              {r.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{r.name}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{r.phone}</div>
            </div>
            <div style={{ fontSize: '12px', color: r.color }}>{r.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowScreen() {
  return (
    <div style={{ background: 'linear-gradient(160deg, #1e1b4b, #2e1065)', height: '100%', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Agent header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '30px', height: '30px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Support Agent</div>
          <div style={{ fontSize: '10px', color: '#a78bfa' }}>● Active · 1,240 conv. this month</div>
        </div>
      </div>
      {/* Config blocks */}
      {[
        { label: 'ROLE', value: 'You are a helpful support agent for Acme Corp. Resolve queries and escalate when needed.' },
        { label: 'GUARDRAILS', value: 'Never share pricing without approval. Do not discuss competitors.' },
        { label: 'TONE', value: "Friendly, concise, professional. Use the customer's first name." },
      ].map((b, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,.08)', borderRadius: '8px', padding: '9px 11px', border: '1px solid rgba(255,255,255,.12)' }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.45)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '4px' }}>{b.label}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>{b.value}</div>
        </div>
      ))}
      {/* Tools */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
        {['Web Search', 'CRM Lookup', 'Create Ticket'].map(t => (
          <span key={t} style={{ background: 'rgba(124,58,237,.45)', border: '1px solid rgba(124,58,237,.6)', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '50px' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function DashboardScreen() {
  const bars = [40, 65, 45, 80, 72, 90, 58, 95, 70, 85, 60, 78];
  return (
    <div style={{ background: '#f8fafc', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px 14px 8px' }}>
        {[
          { label: 'Messages', value: '1,247', change: '+18%', up: true, color: '#25D366' },
          { label: 'Contacts', value: '384', change: '+5%', up: true, color: '#7c3aed' },
          { label: 'Resp. Time', value: '18s', change: '−30%', up: false, color: '#0284c7' },
          { label: 'AI Conv.', value: '3,021', change: '+42%', up: true, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: s.up ? '#16a34a' : '#16a34a', marginTop: '3px', fontWeight: 600 }}>{s.change} today</div>
          </div>
        ))}
      </div>
      {/* Mini bar chart */}
      <div style={{ padding: '6px 14px 8px' }}>
        <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Messages — last 12h</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '42px' }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, background: `linear-gradient(180deg, #25D366, #128C7E)`, borderRadius: '2px 2px 0 0', height: `${h}%`, opacity: 0.7 + (i / bars.length) * 0.3 }} />
          ))}
        </div>
      </div>
      {/* Instances */}
      <div style={{ padding: '0 14px', flex: 1 }}>
        <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Active Instances</div>
        {['Business Line 1', 'Support Line', 'Sales Team'].map((name, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '7px', height: '7px', background: '#25D366', borderRadius: '50%', flexShrink: 0, boxShadow: '0 0 0 2px #dcfce7' }} />
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', flex: 1 }}>{name}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>● Online</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Screen data
───────────────────────────────────────────────────────────── */
const SCREENS = [
  {
    accent: '#25D366',
    accentBg: 'rgba(37,211,102,.15)',
    num: '01',
    tag: 'AI Conversations',
    tagIcon: '🤖',
    headerBg: '#075E54',
    headerTitle: 'SyncChat AI',
    headerSub: '● Online',
    headerEmoji: '🤖',
    screen: <ChatScreen />,
  },
  {
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,.15)',
    num: '02',
    tag: 'Bulk Campaigns',
    tagIcon: '📢',
    headerBg: '#6d28d9',
    headerTitle: 'Campaign Manager',
    headerSub: '● Sending 3,000 msgs',
    headerEmoji: '📢',
    screen: <CampaignScreen />,
  },
  {
    accent: '#38bdf8',
    accentBg: 'rgba(56,189,248,.15)',
    num: '03',
    tag: 'AI Flow Builder',
    tagIcon: '⚡',
    headerBg: '#0369a1',
    headerTitle: 'Flow Builder',
    headerSub: '● Agent Active',
    headerEmoji: '⚡',
    screen: <FlowScreen />,
  },
  {
    accent: '#fbbf24',
    accentBg: 'rgba(251,191,36,.15)',
    num: '04',
    tag: 'Live Dashboard',
    tagIcon: '📊',
    headerBg: '#92400e',
    headerTitle: 'Dashboard',
    headerSub: '● 3 instances connected',
    headerEmoji: '📊',
    screen: <DashboardScreen />,
  },
];

const LEFT_CONTENT = [
  {
    badge: 'AI-Powered WhatsApp Platform',
    title: <>Your WhatsApp,<br /><span style={{ color: '#DCF8C6' }}>On Autopilot</span></>,
    desc: 'SyncChat turns WhatsApp into your most powerful business channel. Automate responses, manage teams, send bulk campaigns, and let AI handle conversations — 24/7.',
    ctas: (
      <div className="hero-btns">
        <Link href="/auth/login" className="btn btn-white btn-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          Start Free
        </Link>
        <Link href="/features" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1.5px solid rgba(255,255,255,.35)' }}>
          See Features
        </Link>
      </div>
    ),
    extra: (
      <div className="hero-stats" style={{ marginTop: '40px', paddingTop: '28px' }}>
        <div className="hero-stat"><div className="num">10k+</div><div className="lbl">Messages / day</div></div>
        <div className="hero-stat"><div className="num">99.9%</div><div className="lbl">Uptime</div></div>
        <div className="hero-stat"><div className="num">24/7</div><div className="lbl">AI responses</div></div>
      </div>
    ),
  },
  {
    badge: 'Bulk Campaigns',
    title: <>Reach 10,000 customers<br /><span style={{ color: '#e9d5ff' }}>in under 5 minutes</span></>,
    desc: 'Send personalised WhatsApp campaigns to your entire contact list. Each message is dynamically personalised — name, order number, custom fields. Track delivery live.',
    ctas: (
      <div className="hero-btns">
        <Link href="/auth/login" className="btn btn-lg" style={{ background: '#a855f7', color: 'white' }}>Start a campaign →</Link>
        <Link href="/features" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: 'white', border: '1.5px solid rgba(255,255,255,.3)' }}>Learn more</Link>
      </div>
    ),
    extra: (
      <div style={{ display: 'flex', gap: '28px', marginTop: '36px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,.2)' }}>
        {[['247K', 'Messages sent'],['98%', 'Delivery rate'],['5 min', 'Avg. campaign time']].map(([n, l]) => (
          <div key={l}><div style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>{n}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,.65)' }}>{l}</div></div>
        ))}
      </div>
    ),
  },
  {
    badge: 'AI Flow Builder',
    title: <>Deploy an AI agent<br /><span style={{ color: '#bae6fd' }}>in minutes, not months</span></>,
    desc: 'Define your agent\'s role, guardrails, and tone in plain English. Connect tools like CRM lookup, ticket creation, and web search. No code required.',
    ctas: (
      <div className="hero-btns">
        <Link href="/auth/login" className="btn btn-lg" style={{ background: '#0ea5e9', color: 'white' }}>Build a flow →</Link>
        <Link href="/features" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: 'white', border: '1.5px solid rgba(255,255,255,.3)' }}>See how it works</Link>
      </div>
    ),
    extra: (
      <div style={{ display: 'flex', gap: '28px', marginTop: '36px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,.2)' }}>
        {[['< 30s', 'AI response time'],['80%', 'Queries auto-resolved'],['24/7', 'Always on']].map(([n, l]) => (
          <div key={l}><div style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>{n}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,.65)' }}>{l}</div></div>
        ))}
      </div>
    ),
  },
  {
    badge: 'Live Dashboard',
    title: <>See everything<br /><span style={{ color: '#fde68a' }}>in real time</span></>,
    desc: 'Monitor messages, AI performance, campaign results, and team activity — all in one beautiful dashboard. Know exactly what\'s happening, always.',
    ctas: (
      <div className="hero-btns">
        <Link href="/auth/login" className="btn btn-lg" style={{ background: '#f59e0b', color: 'white' }}>View dashboard →</Link>
        <Link href="/pricing" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: 'white', border: '1.5px solid rgba(255,255,255,.3)' }}>See pricing</Link>
      </div>
    ),
    extra: (
      <div style={{ display: 'flex', gap: '28px', marginTop: '36px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,.2)' }}>
        {[['3', 'Instances connected'],['1,247', 'Messages today'],['18s', 'Avg response time']].map(([n, l]) => (
          <div key={l}><div style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>{n}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,.65)' }}>{l}</div></div>
        ))}
      </div>
    ),
  },
];

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
export default function HeroScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [scrollPct, setScrollPct] = useState(0);

  // Flip state
  const [displayedActive, setDisplayedActive] = useState(0);
  const [flipRot, setFlipRot] = useState(0);
  const [flipDur, setFlipDur] = useState(300);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevActiveRef = useRef(0);

  const handleScroll = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const total = wrapper.offsetHeight - window.innerHeight;
    const scrolled = Math.max(0, -rect.top);
    const pct = Math.min(1, scrolled / Math.max(1, total));
    setScrollPct(pct);

    const rawIdx = pct * SCREENS.length;
    const idx = Math.min(SCREENS.length - 1, Math.floor(rawIdx));
    setActive(cur => {
      if (cur !== idx) setPrev(cur);
      return idx;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 3-phase flip when active screen changes
  useEffect(() => {
    if (active === prevActiveRef.current) return;
    const direction = active > prevActiveRef.current ? 1 : -1;
    prevActiveRef.current = active;

    setIsFlipping(true);
    // Phase 1: rotate away to edge
    setFlipDur(260);
    setFlipRot(85 * direction);

    const t1 = setTimeout(() => {
      // Phase 2: snap to other edge with new content (instant)
      setFlipDur(0);
      setFlipRot(-85 * direction);
      setDisplayedActive(active);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Phase 3: rotate back to face
          setFlipDur(260);
          setFlipRot(0);
          setTimeout(() => setIsFlipping(false), 270);
        });
      });
    }, 270);

    return () => clearTimeout(t1);
  }, [active]);

  const s = SCREENS[displayedActive];

  return (
    <div ref={wrapperRef} style={{ height: `${SCREENS.length * 100}vh`, position: 'relative' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #075E54 0%, #128C7E 50%, #1d4ed8 100%)',
          backgroundSize: '400% 400%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '5vh',
        }}
      >
        {/* Animated gradient overlay that shifts per screen */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: [
            'linear-gradient(135deg, #075E54 0%, #128C7E 60%, #25D366 100%)',
            'linear-gradient(135deg, #3b0764 0%, #6d28d9 60%, #a855f7 100%)',
            'linear-gradient(135deg, #0c4a6e 0%, #0369a1 60%, #0ea5e9 100%)',
            'linear-gradient(135deg, #78350f 0%, #b45309 60%, #f59e0b 100%)',
          ][active],
          transition: 'background 0.8s ease',
          opacity: 1,
        }} />

        {/* Subtle dot-pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Main layout */}
        <div className="hscroll-grid" style={{
          position: 'relative', zIndex: 2,
          maxWidth: '1160px', width: '100%',
          padding: '0 5vw',
        }}>

          {/* ── LEFT: Feature text panels ── */}
          <div className="hscroll-left" style={{ position: 'relative', minHeight: '420px' }}>
            {LEFT_CONTENT.map((lc, i) => (
              <Panel key={i} active={active === i} prev={prev === i}>
                <h1 style={{
                  fontSize: 'clamp(1.7rem, 3.5vw, 3.2rem)',
                  color: 'white',
                  marginBottom: '20px',
                  lineHeight: 1.15,
                  fontWeight: 800,
                  textShadow: '0 2px 12px rgba(0,0,0,.15)',
                }}>
                  {lc.title}
                </h1>

                <p style={{
                  fontSize: '17px',
                  color: 'rgba(255,255,255,.82)',
                  marginBottom: '32px',
                  maxWidth: '440px',
                  lineHeight: 1.7,
                }}>
                  {lc.desc}
                </p>

                {lc.ctas}
                {lc.extra}
              </Panel>
            ))}
          </div>

          {/* ── RIGHT: Phone ── */}
          <div className="hscroll-right">
            <div className="hscroll-phone-card" style={{
              width: '290px',
              borderRadius: '30px',
              boxShadow: '0 40px 100px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.1)',
              overflow: 'hidden',
              transform: isFlipping
                ? `perspective(900px) rotateY(${flipRot}deg)`
                : `perspective(900px) rotateY(${flipRot}deg) translateY(${Math.sin(scrollPct * Math.PI * 2) * 4}px) rotate(${Math.sin(scrollPct * Math.PI) * 1.5}deg)`,
              transition: `transform ${flipDur}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              background: 'white',
              willChange: 'transform',
            }}>
              {/* Phone header — morphs color */}
              <div style={{
                background: s.headerBg,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background 0.6s ease',
              }}>
                <div style={{
                  width: '36px', height: '36px',
                  background: 'rgba(255,255,255,.2)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}>
                  {s.headerEmoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{s.headerTitle}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.7)' }}>{s.headerSub}</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                </svg>
              </div>

              {/* Phone body — screen content (flip handles transition) */}
              <div className="hscroll-phone-body" style={{ height: '360px', overflow: 'hidden' }}>
                {SCREENS[displayedActive].screen}
              </div>

              {/* Phone bottom bar */}
              <div style={{
                height: '32px',
                background: 'white',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                padding: '0 16px',
              }}>
                {['💬', '👥', '⚡', '📊'].map((icon, i) => (
                  <span key={i} style={{ fontSize: '13px', opacity: active === i ? 1 : 0.35, transition: 'opacity 0.4s ease' }}>{icon}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Progress indicators ── */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
          zIndex: 2,
        }}>
          {/* Segment dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {SCREENS.map((sc, i) => (
              <div key={i} style={{
                height: '6px',
                width: active === i ? '28px' : '6px',
                borderRadius: '3px',
                background: active === i ? 'white' : 'rgba(255,255,255,.35)',
                transition: 'all 0.35s ease',
              }} />
            ))}
          </div>

          {/* Scroll hint (only on first screen) */}
          <div style={{
            opacity: active === 0 ? 1 : 0,
            transition: 'opacity 0.5s ease',
            color: 'rgba(255,255,255,.55)',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Scroll to explore
          </div>
        </div>

      </div>
    </div>
  );
}
