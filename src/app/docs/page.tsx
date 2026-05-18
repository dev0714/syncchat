'use client';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

const WavyDivider = () => (
  <div style={{width:'100%', height:1, background:'rgba(11,31,28,.14)'}} aria-hidden="true"/>
);

function PageHero() {
  return (
    <div className="page-hero-band">
      <div className="wrap">
        <div className="breadcrumb">
          <Link href="/" style={{color:'var(--teal-mid)'}}>home</Link>
          {' / docs'}
        </div>
        <h1 style={{fontSize:'clamp(2.4rem, 4.5vw, 4rem)', color:'var(--ink)', letterSpacing:'-0.03em', marginBottom:18, lineHeight:1.05}}>
          Everything you need to{' '}
          <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>ship an agent.</span>
        </h1>
        <p style={{fontSize:18, color:'var(--ink-soft)', maxWidth:600}}>
          Guides, API references, and code samples. Most of our customers are live in under 30 minutes — these docs help you get there faster.
        </p>
      </div>
    </div>
  );
}

const QUICKSTARTS = [
  { tag:'01 · 5 min', title:'Connect your WhatsApp', desc:'Scan a QR, your number is live. No porting.', icon:'qr', color:'#25D366' },
  { tag:'02 · 10 min', title:'Write your first agent prompt', desc:'Plain English. Role, guardrails, tone — done.', icon:'bot', color:'#6A4FB6' },
  { tag:'03 · 15 min', title:'Plug in tools', desc:'CRM, inventory, calendar — our workflow engine does the wiring.', icon:'plug', color:'#F4B740' },
  { tag:'04 · live', title:'Watch it work', desc:'See every conversation in the dashboard.', icon:'eye', color:'#4FB1E0' },
];

function QuickStart() {
  return (
    <section style={{padding:'72px 0', background:'var(--paper)'}}>
      <div className="wrap">
        <div style={{maxWidth:680, marginBottom:40}}>
          <div className="eyebrow">Quick start</div>
          <h2 style={{fontSize:'clamp(1.8rem, 3vw, 2.6rem)', marginTop:12, color:'var(--ink)', letterSpacing:'-0.02em'}}>Live in 30 minutes.</h2>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}} className="qs-grid">
          {QUICKSTARTS.map((q, i) => (
            <a key={i} href="#" style={{background:'var(--bg)', border:'1px solid var(--line)', borderRadius:18, padding:24, display:'flex', flexDirection:'column', gap:14}}>
              <div style={{width:40, height:40, borderRadius:10, background:q.color+'22', color:q.color, display:'flex', alignItems:'center', justifyContent:'center'}}>
                {q.icon === 'qr' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="15" y="15" width="6" height="6"/></svg>}
                {q.icon === 'bot' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>}
                {q.icon === 'plug' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 2v6M15 2v6M5 8h14v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M12 16v4"/></svg>}
                {q.icon === 'eye' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </div>
              <div>
                <div style={{fontFamily:"'JetBrains Mono'", fontSize:10, color:q.color, fontWeight:700, letterSpacing:'.06em', marginBottom:6}}>{q.tag}</div>
                <h3 style={{fontSize:16, color:'var(--ink)', letterSpacing:'-0.01em', marginBottom:6}}>{q.title}</h3>
                <p style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.5}}>{q.desc}</p>
              </div>
              <div style={{marginTop:'auto', fontSize:12, color:'var(--teal-mid)', fontWeight:600}}>Read guide →</div>
            </a>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ .qs-grid{ grid-template-columns: 1fr 1fr !important; }}
        @media (max-width: 540px){ .qs-grid{ grid-template-columns: 1fr !important; }}
      `}</style>
    </section>
  );
}

const SECTIONS = [
  { title:'Getting started', items:['Create your account','Connect WhatsApp instance','Invite your team','Import contacts','Send your first message'] },
  { title:'AI agent', items:['Anatomy of an agent','Writing the role','Guardrails that actually work','Tone & language','Memory & context','Handoff to humans'] },
  { title:'Tools & integrations', items:['Built-in tools','Connecting your CRM','Custom HTTP tools','Workflow automations','Webhooks','Database setup'] },
  { title:'Campaigns', items:['Message templates','Variables & personalisation','Sending bulk','Scheduled bulk','Recurring schedules','Delivery reports'] },
  { title:'Team & access', items:['Roles explained','Granting access','Assigning conversations','Activity logs','Removing members'] },
  { title:'Billing', items:['Plans overview','Switching tiers','Annual vs monthly','Invoices & VAT','Cancelling'] },
];

function Docs() {
  const [active, setActive] = useState('Getting started');

  return (
    <section style={{padding:'72px 0', background:'var(--bg)'}}>
      <div className="wrap docs-layout" style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:48, alignItems:'start'}}>
        <aside style={{position:'sticky', top:88, background:'var(--paper)', border:'1px solid var(--line)', borderRadius:18, padding:20}} className="docs-sidebar">
          <div style={{fontFamily:"'JetBrains Mono'", fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12}}>Sections</div>
          <ul style={{listStyle:'none', display:'flex', flexDirection:'column', gap:4}}>
            {SECTIONS.map(s => (
              <li key={s.title}>
                <button onClick={() => setActive(s.title)} style={{display:'block', width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:8, background: active === s.title ? 'var(--ink)' : 'transparent', color: active === s.title ? '#fff' : 'var(--ink-soft)', fontSize:13, fontWeight: active === s.title ? 600 : 500}}>
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div>
          <h2 style={{fontSize:'clamp(1.8rem, 3vw, 2.6rem)', color:'var(--ink)', letterSpacing:'-0.02em', marginBottom:8}}>{active}</h2>
          <p style={{fontSize:15, color:'var(--ink-soft)', marginBottom:32}}>Browse the guides below, or jump straight into a topic.</p>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}} className="docs-grid">
            {SECTIONS.find(s => s.title === active)?.items.map((item, i) => (
              <a key={i} href="#" style={{background:'var(--paper)', border:'1px solid var(--line)', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:11, color:'var(--muted)', fontFamily:"'JetBrains Mono'", marginBottom:2}}>0{i+1}</div>
                  <div style={{fontSize:14, fontWeight:600, color:'var(--ink)'}}>{item}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.4" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </a>
            ))}
          </div>

          {(active === 'AI agent' || active === 'Tools & integrations') && (
            <div style={{marginTop:32}}>
              <div style={{fontFamily:"'JetBrains Mono'", fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10}}>Sample agent prompt</div>
              <div style={{background:'#0B1F1C', color:'#DCF8C6', borderRadius:14, padding:'20px 22px', fontFamily:"'JetBrains Mono'", fontSize:13, lineHeight:1.7, overflow:'auto'}}>
                <div style={{color:'#7C9C9C'}}># SyncChat Support Assistant</div>
                <div style={{color:'#7C9C9C'}}>## Identity</div>
                <div>You are <span style={{color:'#F4B740'}}>SyncChat Assistant</span>, the WhatsApp agent for Acme Sneakers.</div>
                <br/>
                <div style={{color:'#7C9C9C'}}>## Core behavior</div>
                <div>- Be concise, friendly, and practical.</div>
                <div>- Use the customer&apos;s first name when known.</div>
                <div>- Stay focused on shoes, orders, returns, and store info.</div>
                <br/>
                <div style={{color:'#7C9C9C'}}>## Tools available</div>
                <div>- <span style={{color:'#25D366'}}>Inventory.Lookup</span> — stock + holds</div>
                <div>- <span style={{color:'#25D366'}}>Orders.Status</span> — shipping + tracking</div>
                <div>- <span style={{color:'#25D366'}}>CRM.Lookup</span> — customer history</div>
                <br/>
                <div style={{color:'#7C9C9C'}}>## Guardrails</div>
                <div>- Never quote prices outside displayed listings.</div>
                <div>- Escalate to <span style={{color:'#F4B740'}}>@Thabo</span> on refunds over R5,000.</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){
          .docs-layout{ grid-template-columns: 1fr !important; gap: 32px !important;}
          .docs-sidebar{ position: static !important;}
          .docs-grid{ grid-template-columns: 1fr !important;}
        }
      `}</style>
    </section>
  );
}

function APITeaser() {
  return (
    <section style={{padding:'80px 0', background:'var(--ink)', color:'#fff', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 80% 50%, rgba(37,211,102,.10), transparent 50%)`}}/>
      <div className="wrap" style={{position:'relative'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:48, alignItems:'center'}} className="api-grid">
          <div>
            <div className="eyebrow" style={{color:'#25D366'}}>For developers</div>
            <h2 style={{fontSize:'clamp(1.8rem, 3vw, 2.6rem)', color:'#fff', marginTop:12, letterSpacing:'-0.025em'}}>
              REST API.<br/>
              <span style={{color:'#DCF8C6', fontStyle:'italic'}}>Webhooks. Workflow nodes.</span>
            </h2>
            <p style={{fontSize:16, color:'rgba(255,255,255,.7)', marginTop:18, maxWidth:380, lineHeight:1.6}}>
              Every action in the dashboard is available via API. Build custom tools, integrate with anything, ship faster.
            </p>
            <div style={{display:'flex', gap:10, flexWrap:'wrap', marginTop:24}}>
              <a href="#" className="btn btn-green" style={{padding:'12px 18px', fontSize:14}}>API reference →</a>
              <a href="#" className="btn" style={{padding:'12px 18px', fontSize:14, background:'rgba(255,255,255,.08)', color:'#fff', border:'1px solid rgba(255,255,255,.15)'}}>Postman collection</a>
            </div>
          </div>
          <div style={{background:'#000', borderRadius:14, padding:'22px 24px', fontFamily:"'JetBrains Mono'", fontSize:13, lineHeight:1.7, border:'1px solid rgba(255,255,255,.1)', boxShadow:'0 20px 60px -20px rgba(0,0,0,.6)', overflow:'auto'}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14, fontSize:11, color:'rgba(255,255,255,.5)'}}>
              <span style={{width:9, height:9, borderRadius:50, background:'#FF5F57'}}/>
              <span style={{width:9, height:9, borderRadius:50, background:'#FEBC2E'}}/>
              <span style={{width:9, height:9, borderRadius:50, background:'#27C840'}}/>
              <span style={{marginLeft:10}}>curl</span>
            </div>
            <div style={{color:'#7C9C9C'}}># Send a WhatsApp message via Syncchat</div>
            <div><span style={{color:'#F4B740'}}>POST</span> <span style={{color:'#DCF8C6'}}>https://api.syncchat.co.za/v1/messages</span></div>
            <br/>
            <div style={{color:'#7C9C9C'}}># Headers</div>
            <div>Authorization: <span style={{color:'#25D366'}}>Bearer sk_live_...</span></div>
            <div>Content-Type: application/json</div>
            <br/>
            <div style={{color:'#7C9C9C'}}># Body</div>
            <div>{'{'}</div>
            <div>{'  '}<span style={{color:'#C4B5FD'}}>&quot;instance_id&quot;</span>: <span style={{color:'#DCF8C6'}}>&quot;acme-main&quot;</span>,</div>
            <div>{'  '}<span style={{color:'#C4B5FD'}}>&quot;to&quot;</span>: <span style={{color:'#DCF8C6'}}>&quot;+27821234567&quot;</span>,</div>
            <div>{'  '}<span style={{color:'#C4B5FD'}}>&quot;template&quot;</span>: <span style={{color:'#DCF8C6'}}>&quot;order_shipped&quot;</span>,</div>
            <div>{'  '}<span style={{color:'#C4B5FD'}}>&quot;variables&quot;</span>: {'{ '}<span style={{color:'#C4B5FD'}}>&quot;name&quot;</span>: <span style={{color:'#DCF8C6'}}>&quot;Sarah&quot;</span>{' }'}</div>
            <div>{'}'}</div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .api-grid{ grid-template-columns: 1fr !important; }}`}</style>
    </section>
  );
}

function Help() {
  return (
    <section style={{padding:'80px 0', background:'var(--bg)'}}>
      <div className="wrap" style={{textAlign:'center', maxWidth:640, margin:'0 auto'}}>
        <h2 style={{fontSize:'clamp(1.8rem, 3vw, 2.6rem)', color:'var(--ink)', letterSpacing:'-0.025em', marginBottom:16}}>
          Stuck on something?<br/>
          <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>Just ask our agent.</span>
        </h2>
        <p style={{fontSize:16, color:'var(--ink-soft)', marginBottom:28}}>
          Our own Syncchat agent is on +27 82 555 0123. Ask it anything about the platform — it can look up your specific docs, screenshots, and even create a support ticket if needed.
        </p>
        <div style={{display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap'}}>
          <a href="https://wa.me/27825550123" className="btn btn-green" style={{padding:'14px 22px', fontSize:15}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Chat on WhatsApp
          </a>
          <Link href="/contact" className="btn btn-ghost" style={{padding:'14px 22px', fontSize:15}}>Email support</Link>
        </div>
      </div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div style={{background:'var(--bg)'}}>
      <Navbar />
      <PageHero />
      <WavyDivider />
      <QuickStart />
      <WavyDivider />
      <Docs />
      <WavyDivider />
      <APITeaser />
      <WavyDivider />
      <Help />
      <Footer />
    </div>
  );
}
