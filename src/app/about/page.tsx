'use client';
import Link from 'next/link';
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
          {' / about'}
        </div>
        <h1 style={{fontSize:'clamp(2.4rem, 4.5vw, 4rem)', color:'var(--ink)', letterSpacing:'-0.03em', marginBottom:18, lineHeight:1.05}}>
          A small SA team,{' '}
          <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>building the WhatsApp agent we wished existed.</span>
        </h1>
        <p style={{fontSize:18, color:'var(--ink-soft)', maxWidth:640}}>
          We started because we were the customers — drowning in WhatsApp messages, with no bot that was good enough to trust. So we built one.
        </p>
      </div>
    </div>
  );
}

function Mission() {
  return (
    <section style={{padding:'88px 0', background:'var(--bg)'}}>
      <div className="wrap">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center'}} className="mission-grid">
          <div>
            <div className="eyebrow">Why we built this</div>
            <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', marginTop:14, color:'var(--ink)', letterSpacing:'-0.025em'}}>
              In South Africa, WhatsApp <em style={{color:'var(--teal-mid)'}}>is</em> the inbox.
            </h2>
            <div style={{display:'flex', flexDirection:'column', gap:18, marginTop:24, fontSize:17, color:'var(--ink-soft)'}}>
              <p>96% of South Africans use WhatsApp every day. Customers don&apos;t email. They don&apos;t fill in forms. They WhatsApp the number on the bottom of the receipt and expect a reply.</p>
              <p>Most businesses can&apos;t keep up. A few staff, a borrowed phone, hundreds of messages an hour. So messages go unanswered, leads go cold, and good customers churn.</p>
              <p style={{color:'var(--ink)', fontWeight:600}}>We built Syncchat so a small team can run WhatsApp like a 24/7 contact centre — with one AI agent doing the boring 80%, and your people handling what actually needs a person.</p>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            {[
              ['96%','of South Africans use WhatsApp daily','#25D366','var(--sage)'],
              ['25M+','SA WhatsApp users in 2026','#6A4FB6','#EDE4FF'],
              ['72%','prefer chat over a call','#F4B740','#FFF1CC'],
              ['<60s','expected reply time','#4FB1E0','#DBEEF8'],
            ].map(([n,l,c,bg], i) => (
              <div key={i} style={{background:bg, borderRadius:18, padding:24, aspectRatio:'1/1', display:'flex', flexDirection:'column', justifyContent:'flex-end', position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute', top:-10, right:-10, width:80, height:80, borderRadius:'50%', background:c, opacity:.15}}/>
                <div style={{fontFamily:"'Bricolage Grotesque'", fontSize:'clamp(2.2rem, 4vw, 3rem)', fontWeight:700, color:c, letterSpacing:'-0.03em', lineHeight:.95}}>{n}</div>
                <div style={{fontSize:12, color:'var(--ink-soft)', marginTop:8, lineHeight:1.4, fontWeight:500}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .mission-grid{ grid-template-columns: 1fr !important; gap: 40px !important;} }`}</style>
    </section>
  );
}

const STORY = [
  ['2024','The problem','One of us was running a 6-person retail business. WhatsApp messages were drowning the team. We tried 4 different bots — all bad. They couldn\'t lookup an order or hold an item.'],
  ['Early 2025','The hack','We rigged up a workflow engine + an AI model to read incoming WhatsApp and call our inventory API. Customers couldn\'t tell it wasn\'t a person. Response time dropped from 4 hours to 30 seconds.'],
  ['Mid 2025','The realisation','Every business we showed this to wanted it. So we wrapped the workflow in a real product, added a CRM, a team, dashboards. Syncchat.'],
  ['2026','Now','Helping South African businesses turn their busiest channel into their easiest one. Same workflow-powered agent under the hood — just a lot more polish around it.'],
];

function Story() {
  return (
    <section style={{padding:'88px 0', background:'var(--paper)'}}>
      <div className="wrap">
        <div style={{maxWidth:680, marginBottom:48}}>
          <div className="eyebrow">How we got here</div>
          <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', marginTop:14, color:'var(--ink)', letterSpacing:'-0.025em'}}>Built out of a real headache.</h2>
        </div>
        <div style={{position:'relative', maxWidth:820, margin:'0 auto'}}>
          <div style={{position:'absolute', left:120, top:0, bottom:0, width:2, background:'var(--line)'}} className="story-line"/>
          {STORY.map(([year, t, d], i) => (
            <div key={i} style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:32, marginBottom: i < STORY.length-1 ? 40 : 0, position:'relative'}} className="story-row">
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', paddingRight:24}}>
                <div style={{fontFamily:"'JetBrains Mono'", fontSize:13, fontWeight:600, color:'var(--teal-mid)', background:'var(--paper)', padding:'4px 10px', border:'1px solid var(--line)', borderRadius:6}}>{year}</div>
              </div>
              <div style={{position:'relative', paddingLeft:32}}>
                <div style={{position:'absolute', left:-7, top:6, width:14, height:14, borderRadius:50, background:'var(--green)', border:'3px solid var(--paper)', boxShadow:'0 0 0 2px var(--line)'}}/>
                <h3 style={{fontSize:22, color:'var(--ink)', marginBottom:8, letterSpacing:'-0.01em'}}>{t}</h3>
                <p style={{fontSize:15, color:'var(--ink-soft)', lineHeight:1.6, maxWidth:560}}>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 700px){ .story-row{ grid-template-columns: 1fr !important; gap: 12px !important;} .story-row > div:first-child{ align-items: flex-start !important; padding-right: 0 !important;} .story-row > div:last-child{ padding-left: 0 !important;} .story-line{ display:none; } }
      `}</style>
    </section>
  );
}

const VALUES = [
  { title:'Replies before forms.', desc:"If a customer can chat in 5 seconds, don't make them fill in 5 fields. Our whole product is built around this.", bg:'#DCF8C6', accent:'#075E54', emoji:'💬' },
  { title:'Boring tech, novel UX.', desc:'We use a battle-tested workflow engine, a leading AI model, and solid infrastructure — all stable, all well-understood. The magic is in how we wire them together.', bg:'#EDE4FF', accent:'#6A4FB6', emoji:'⚡' },
  { title:"Show, don't guess.", desc:'Every AI message is logged. Every agent decision is auditable. You see exactly what is happening, never wondering.', bg:'#FFF1CC', accent:'#92400E', emoji:'🔍' },
  { title:'Built in 🇿🇦, for 🇿🇦.', desc:'Local pricing in ZAR. Africa/Joburg timezone everywhere. POPIA-aware. Made for the messy reality of selling here.', bg:'#FCE2D7', accent:'#9A3412', emoji:'🌍' },
];

function Values() {
  return (
    <section style={{padding:'88px 0', background:'var(--bg)'}}>
      <div className="wrap">
        <div style={{maxWidth:680, marginBottom:48}}>
          <div className="eyebrow">What we believe</div>
          <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', marginTop:14, color:'var(--ink)', letterSpacing:'-0.025em'}}>
            The four things we won&apos;t compromise on.
          </h2>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}} className="values-grid">
          {VALUES.map((v, i) => (
            <div key={i} style={{background:v.bg, borderRadius:20, padding:32, position:'relative', overflow:'hidden', border:`1px solid ${v.accent}1a`}}>
              <div style={{position:'absolute', top:24, right:24, fontSize:32, opacity:.9}}>{v.emoji}</div>
              <div style={{fontFamily:"'JetBrains Mono'", fontSize:11, fontWeight:600, color:v.accent, letterSpacing:'.08em', marginBottom:14}}>VALUE / 0{i+1}</div>
              <h3 style={{fontSize:24, color:'var(--ink)', letterSpacing:'-0.02em', marginBottom:12, lineHeight:1.15, fontFamily:"'Bricolage Grotesque'", maxWidth:'80%'}}>{v.title}</h3>
              <p style={{fontSize:15, color:'var(--ink-soft)', lineHeight:1.55, maxWidth:'90%'}}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 700px){ .values-grid{ grid-template-columns: 1fr !important; }}`}</style>
    </section>
  );
}

const TEAM = [
  ['Andre du Plessis','Founder & CEO','AP','#0B3B36','Was running the retail shop that started all this. Now obsessed with making customer support disappear.'],
  ['Thabo Mokoena','Co-founder, Engineering','TM','#25D366','Wires up the workflow engine and AI plumbing that makes every reply feel instant.'],
  ['Priya Sharma','Head of Product','PS','#6A4FB6','Designs how the agent thinks. Obsessive about guardrails and graceful handoffs.'],
  ['Nadia van der Berg','Customer success','NV','#F4B740','Hand-holds new clients through their first AI deployment. Has set up 200+ agents.'],
];

function Team() {
  return (
    <section style={{padding:'88px 0', background:'var(--paper)'}}>
      <div className="wrap">
        <div style={{maxWidth:680, marginBottom:48}}>
          <div className="eyebrow">The team</div>
          <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', marginTop:14, color:'var(--ink)', letterSpacing:'-0.025em'}}>
            Small team. <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>Loud product.</span>
          </h2>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:18}} className="team-grid">
          {TEAM.map((t, i) => (
            <div key={i} style={{background:'var(--bg)', border:'1px solid var(--line)', borderRadius:18, padding:24, display:'flex', flexDirection:'column', gap:14}}>
              <div style={{width:64, height:64, borderRadius:50, background:t[3], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bricolage Grotesque'", fontWeight:700, fontSize:22, letterSpacing:'-0.02em'}}>{t[2]}</div>
              <div>
                <h3 style={{fontSize:16, color:'var(--ink)', letterSpacing:'-0.01em', marginBottom:2}}>{t[0]}</h3>
                <div style={{fontSize:12, color:'var(--teal-mid)', fontWeight:600}}>{t[1]}</div>
              </div>
              <p style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.5}}>{t[4]}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ .team-grid{ grid-template-columns: 1fr 1fr !important; }}
        @media (max-width: 540px){ .team-grid{ grid-template-columns: 1fr !important; }}
      `}</style>
    </section>
  );
}

function Stack() {
  const items = [
    ['Workflows','Automation engine','#FF6D5A'],
    ['AI Model','Best-in-class LLM','#10A37F'],
    ['PostgreSQL','Database + auth','#336791'],
    ['WhatsApp API','Official gateway','#25D366'],
    ['React','Web platform','#61DAFB'],
    ['Payments','ZAR billing','#0BA4DB'],
  ];
  return (
    <section style={{padding:'80px 0', background:'var(--ink)', color:'#fff', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 30% 30%, rgba(37,211,102,.10), transparent 50%)`}}/>
      <div className="wrap" style={{position:'relative'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:64, alignItems:'center'}} className="stack-grid">
          <div>
            <div className="eyebrow" style={{color:'#25D366'}}>The stack</div>
            <h2 style={{fontSize:'clamp(1.8rem, 3vw, 2.6rem)', color:'#fff', marginTop:14, letterSpacing:'-0.025em'}}>
              Boring tech we trust.<br/>
              <span style={{color:'#DCF8C6', fontStyle:'italic'}}>No magic. No black boxes.</span>
            </h2>
            <p style={{fontSize:16, color:'rgba(255,255,255,.7)', marginTop:18, maxWidth:380, lineHeight:1.6}}>
              Every Syncchat conversation flows through the same well-understood tools you can audit, debug, and trust.
            </p>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}} className="stack-items">
            {items.map(([n, d, c]) => (
              <div key={n} style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:18, display:'flex', flexDirection:'column', gap:10}}>
                <div style={{width:32, height:32, borderRadius:8, background:c, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bricolage Grotesque'", fontSize:14, fontWeight:700, color:'#fff'}}>{n[0]}</div>
                <div>
                  <div style={{fontSize:15, fontWeight:700, color:'#fff'}}>{n}</div>
                  <div style={{fontSize:12, color:'rgba(255,255,255,.55)', marginTop:2}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ .stack-grid{ grid-template-columns: 1fr !important; gap: 40px !important;} .stack-items{ grid-template-columns: 1fr 1fr !important;}}
      `}</style>
    </section>
  );
}

function Closing() {
  return (
    <section style={{padding:'96px 0', background:'var(--bg)'}}>
      <div className="wrap" style={{textAlign:'center', maxWidth:680, margin:'0 auto'}}>
        <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', color:'var(--ink)', letterSpacing:'-0.025em', marginBottom:18}}>
          Want to chat?<br/>
          <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>On WhatsApp, of course.</span>
        </h2>
        <p style={{fontSize:17, color:'var(--ink-soft)', marginBottom:32}}>
          Drop us a message. Our own AI agent will answer first — a real human steps in if you ask, or it can&apos;t.
        </p>
        <div style={{display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap'}}>
          <Link href="/contact" className="btn btn-primary" style={{padding:'16px 26px', fontSize:16}}>Get in touch</Link>
          <Link href="/auth/login" className="btn btn-ghost" style={{padding:'16px 26px', fontSize:16}}>Try the demo</Link>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div style={{background:'var(--bg)'}}>
      <Navbar />
      <PageHero />
      <WavyDivider />
      <Mission />
      <WavyDivider />
      <Story />
      <WavyDivider />
      <Values />
      <WavyDivider />
      <Team />
      <WavyDivider />
      <Stack />
      <WavyDivider />
      <Closing />
      <Footer />
    </div>
  );
}
