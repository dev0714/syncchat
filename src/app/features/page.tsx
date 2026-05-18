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
          {' / features'}
        </div>
        <h1 style={{fontSize:'clamp(2.4rem, 4.5vw, 4rem)', color:'var(--ink)', letterSpacing:'-0.03em', marginBottom:18, lineHeight:1.05}}>
          The WhatsApp business platform,{' '}
          <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>fully loaded.</span>
        </h1>
        <p style={{fontSize:18, color:'var(--ink-soft)', maxWidth:640}}>
          From AI agents that actually understand to bulk campaigns that fly, contact management that scales, and team controls you can trust.
        </p>
      </div>
    </div>
  );
}

function VisualAgent() {
  return (
    <div style={{background:'#0B1F1C', borderRadius:18, padding:24, color:'#fff', position:'relative', overflow:'hidden', boxShadow:'0 30px 60px -20px rgba(11,31,28,.3)'}}>
      <div style={{position:'absolute', top:-40, right:-40, width:180, height:180, background:'radial-gradient(circle, rgba(106,79,182,.25), transparent 70%)', filter:'blur(20px)'}}/>
      <div style={{position:'relative', display:'flex', alignItems:'center', gap:10, marginBottom:18}}>
        <div style={{width:34, height:34, borderRadius:9, background:'#6A4FB6', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700, fontSize:14}}>Support Agent</div>
          <div style={{fontSize:11, color:'rgba(255,255,255,.55)'}}>● Active · 1,240 conv. this month</div>
        </div>
        <div className="chip" style={{background:'rgba(37,211,102,.15)', color:'#25D366', border:'1px solid rgba(37,211,102,.3)', fontSize:10}}>
          <span className="pulse"/>LIVE
        </div>
      </div>
      <div style={{position:'relative', display:'flex', flexDirection:'column', gap:8}}>
        {[
          ['Role','You are a helpful support agent for Acme Sneakers. Resolve queries, take action when possible, escalate when needed.'],
          ['Guardrails','Never share pricing without approval. Stay polite even when customers are not.'],
          ['Tone',"Friendly, concise, on-brand. Use the customer's first name."],
          ['Memory','Last 20 messages per conversation.'],
        ].map(([k, v]) => (
          <div key={k} style={{background:'rgba(255,255,255,.05)', borderRadius:10, padding:'9px 12px', border:'1px solid rgba(255,255,255,.08)'}}>
            <div style={{fontSize:9, color:'rgba(255,255,255,.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3, fontFamily:"'JetBrains Mono'"}}>{k}</div>
            <div style={{fontSize:13, color:'rgba(255,255,255,.92)', lineHeight:1.45}}>{v}</div>
          </div>
        ))}
        <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:6}}>
          {['Inventory · Lookup','CRM · Customer','Orders · Status','Web search'].map(t => (
            <span key={t} style={{fontSize:10, padding:'4px 9px', borderRadius:50, background:'rgba(106,79,182,.2)', color:'#C4B5FD', border:'1px solid rgba(106,79,182,.4)', fontFamily:"'JetBrains Mono'"}}>⚡ {t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualBulk() {
  return (
    <div style={{background:'#fff', border:'1px solid var(--line)', borderRadius:18, overflow:'hidden', boxShadow:'0 20px 40px -20px rgba(11,31,28,.12)'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'var(--bg)', borderBottom:'1px solid var(--line)'}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div style={{fontFamily:"'JetBrains Mono'", fontSize:11, color:'var(--muted)'}}>CAMPAIGN /</div>
          <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>Black Friday — Weekend</div>
        </div>
        <span className="chip" style={{fontSize:10, padding:'3px 9px'}}><span className="pulse"/> Sending</span>
      </div>
      <div style={{padding:'20px 18px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
          <div style={{fontFamily:"'Bricolage Grotesque'", fontSize:30, fontWeight:700, color:'var(--ink)', letterSpacing:'-0.02em'}}>2,247</div>
          <div style={{fontSize:12, color:'var(--teal-mid)', fontWeight:600}}>74% complete</div>
        </div>
        <div style={{fontSize:11, color:'var(--muted)', marginBottom:14}}>of 3,000 contacts</div>
        <div style={{height:6, background:'var(--line)', borderRadius:3, overflow:'hidden', marginBottom:18}}>
          <div style={{width:'74%', height:'100%', background:'linear-gradient(90deg, #25D366, #128C7E)', borderRadius:3}}/>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {[['Sarah K.','+27 82 ••• 4567','✓✓','sent'],['Thabo M.','+27 71 ••• 6543','✓✓','sent'],['Priya S.','+27 83 ••• 1234','✓','delivered'],['Nadia V.','+27 79 ••• 3210','⏳','queued']].map(([n,p,s,st], i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'7px 10px', background:'var(--bg)', borderRadius:8, fontSize:12}}>
              <div style={{width:24, height:24, borderRadius:50, background:'var(--sage)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--teal)'}}>{n.split(' ')[0][0]}{n.split(' ')[1]?.[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600, color:'var(--ink)'}}>{n}</div>
                <div style={{fontSize:10, color:'var(--muted)'}}>{p}</div>
              </div>
              <div style={{fontSize:11, color: st === 'queued' ? 'var(--muted)' : 'var(--green-bright)', fontWeight:600}}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualContacts() {
  const rows = [['Sarah Khumalo','+27 82 ••• 4567','VIP','#25D366'],['Thabo Mokoena','+27 71 ••• 6543','Lead','#6A4FB6'],['Priya Sharma','+27 83 ••• 1234','Customer','#F4B740'],['Nadia v.d. Berg','+27 79 ••• 3210','VIP','#25D366'],['Andre du Plessis','+27 84 ••• 5566','Lead','#6A4FB6']];
  return (
    <div style={{background:'#fff', border:'1px solid var(--line)', borderRadius:18, overflow:'hidden', boxShadow:'0 20px 40px -20px rgba(11,31,28,.12)'}}>
      <div style={{padding:'14px 18px', background:'var(--bg)', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>Contacts</div>
          <div style={{fontFamily:"'JetBrains Mono'", fontSize:11, color:'var(--muted)'}}>· 2,847 total</div>
        </div>
        <div style={{display:'flex', gap:6}}>
          <span style={{fontSize:11, fontWeight:600, color:'var(--teal)', padding:'4px 9px', background:'var(--sage)', borderRadius:6}}>+ Import CSV</span>
          <span style={{fontSize:11, fontWeight:600, color:'#fff', padding:'4px 9px', background:'var(--ink)', borderRadius:6}}>+ Add</span>
        </div>
      </div>
      <div>
        <div style={{display:'grid', gridTemplateColumns:'2fr 2fr 1fr', gap:0, padding:'10px 18px', fontFamily:"'JetBrains Mono'", fontSize:10, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--line-soft)'}}>
          <span>Name</span><span>Phone</span><span>Tag</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{display:'grid', gridTemplateColumns:'2fr 2fr 1fr', gap:0, padding:'12px 18px', fontSize:13, alignItems:'center', borderBottom: i < rows.length-1 ? '1px solid var(--line-soft)' : 'none'}}>
            <span style={{fontWeight:600, color:'var(--ink)'}}>{r[0]}</span>
            <span style={{color:'var(--muted)', fontFamily:"'JetBrains Mono'", fontSize:11}}>{r[1]}</span>
            <span><span style={{background:r[3]+'22', color:r[3], fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:50}}>{r[2]}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualDashboard() {
  const bars = [40, 65, 45, 80, 72, 90, 58, 95, 70, 85, 60, 78];
  return (
    <div style={{background:'#fff', border:'1px solid var(--line)', borderRadius:18, padding:20, boxShadow:'0 20px 40px -20px rgba(11,31,28,.12)'}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14}}>
        {[['Messages','1,247','+18%','#25D366'],['Contacts','384','+5%','#6A4FB6'],['Resp. time','18s','−30%','#F4B740'],['AI Conv.','3,021','+42%','#4FB1E0']].map(([l,v,c,col]) => (
          <div key={l} style={{background:'var(--bg)', borderRadius:10, padding:'10px 12px'}}>
            <div style={{fontSize:10, color:'var(--muted)', fontFamily:"'JetBrains Mono'", fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em'}}>{l}</div>
            <div style={{fontSize:22, fontWeight:700, fontFamily:"'Bricolage Grotesque'", color:'var(--ink)', letterSpacing:'-0.02em', marginTop:4, lineHeight:1}}>{v}</div>
            <div style={{fontSize:10, color:col, fontWeight:600, marginTop:4}}>{c} today</div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10, color:'var(--muted)', fontFamily:"'JetBrains Mono'", fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8}}>Messages · last 12h</div>
        <div style={{display:'flex', alignItems:'flex-end', gap:3, height:50}}>
          {bars.map((h, i) => (
            <div key={i} style={{flex:1, background:'linear-gradient(180deg, #25D366, #128C7E)', borderRadius:'2px 2px 0 0', height:`${h}%`, opacity:0.55 + (i / bars.length) * 0.4}}/>
          ))}
        </div>
      </div>
      <div style={{borderTop:'1px solid var(--line)', paddingTop:12, display:'flex', flexDirection:'column', gap:6}}>
        {['Business Line 1','Support Line','Sales Team'].map(n => (
          <div key={n} style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
            <div style={{width:6, height:6, borderRadius:50, background:'var(--green)', boxShadow:'0 0 0 2px var(--sage)'}}/>
            <div style={{flex:1, fontWeight:600, color:'var(--ink)'}}>{n}</div>
            <div style={{fontSize:10, color:'var(--muted)'}}>● Online</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATS = [
  {
    tag:'AI Agent',
    title:'A WhatsApp brain that actually understands.',
    desc:'Define your AI agent in plain English — role, guardrails, tone, memory. It reads every message, decides what to do, and replies in your voice.',
    bullets:['Plain-English prompt builder — no code, no flowcharts','Guardrails stop it from saying things it shouldn\'t','20-message rolling memory per contact','Hands off to your team when it should','Tool-using: lookups, holds, tickets, schedules'],
    visual:<VisualAgent/>,
    reverse:false,
  },
  {
    tag:'Bulk',
    title:'Reach 10,000 customers in five minutes.',
    desc:'Pick a template, choose a segment, hit send. Variables fill themselves. Failures retry. Reports are live.',
    bullets:['Personalisation with custom variables','Preview the first 3 messages before sending','Live progress bar, retry on failure, delivery reports','Schedule sends — one-time or recurring (Africa/Joburg time)'],
    reverse:true,
    visual:<VisualBulk/>,
  },
  {
    tag:'Contacts',
    title:'10 or 10,000 contacts — same effort.',
    desc:'CSV import, smart tagging, full conversation history per contact. Searchable, segmentable, ready for campaigns.',
    bullets:['CSV import with auto field-mapping','Tag any way you want — campaigns target tags directly','Full conversation history per contact, forever','Search and filter across 10,000+ records in milliseconds'],
    visual:<VisualContacts/>,
    reverse:false,
  },
  {
    tag:'Dashboard',
    title:'Everything happening, in one screen.',
    desc:'Live stats. Instance status. Active conversations. AI agent performance. Knowing exactly what is happening, without asking.',
    bullets:['Live message volume, response times, AI conversion','Per-instance health — number connections, error counts','Connected agents, active conversations, queues','Filter by date range, instance, agent, contact tag'],
    visual:<VisualDashboard/>,
    reverse:true,
  },
];

const ALL_FEATURES = [
  ['💬','WhatsApp messaging','Two-way messaging with read receipts, media, threading.'],
  ['🤖','AI agent flows','Prompt builder with roles, guardrails, tone, tools.'],
  ['📄','Message templates','Dynamic templates with custom variables.'],
  ['📢','Bulk campaigns','Send to thousands with live progress + reports.'],
  ['📊','Live dashboard','Real-time metrics, instances, conversations.'],
  ['📱','Multi-instance','Multiple WhatsApp numbers, one dashboard.'],
  ['🧑‍🤝‍🧑','Team roles','Granular RBAC — super, admin, agent, viewer.'],
  ['🔁','Real-time sync','Messages sync instantly across the team.'],
  ['🗓️','Scheduled bulk','One-time and recurring campaigns.'],
  ['⚡','Workflow integrations','400+ pre-built tools at the agent\'s fingertips.'],
  ['🔐','Encrypted credentials','WhatsApp API tokens stored super-admin-only.'],
  ['📥','CSV import','Auto field mapping, dedupe, validation.'],
];

export default function FeaturesPage() {
  return (
    <div style={{background:'var(--bg)'}}>
      <Navbar />
      <PageHero />
      <WavyDivider />

      {FEATS.map((f, i) => (
        <div key={f.tag}>
          <section style={{padding:'72px 0', background: i % 2 ? 'var(--paper)' : 'var(--bg)'}}>
            <div className="wrap">
              <div style={{display:'grid', gridTemplateColumns: f.reverse ? '1fr 1.1fr' : '1.1fr 1fr', gap:64, alignItems:'center'}} className="feat-row">
                <div style={{order: f.reverse ? 2 : 1}}>
                  <div style={{fontFamily:"'JetBrains Mono'", fontSize:11, fontWeight:600, color:'var(--teal-mid)', letterSpacing:'.08em', marginBottom:14, display:'flex', alignItems:'center', gap:8}}>
                    <span>FEATURE / 0{i+1}</span>
                    <span style={{width:24, height:1, background:'var(--teal-mid)', opacity:.4}}/>
                    <span>{f.tag}</span>
                  </div>
                  <h2 style={{fontSize:'clamp(1.8rem, 3.4vw, 2.8rem)', color:'var(--ink)', marginBottom:18, letterSpacing:'-0.025em', lineHeight:1.1}}>{f.title}</h2>
                  <p style={{fontSize:17, color:'var(--ink-soft)', marginBottom:24, maxWidth:480}}>{f.desc}</p>
                  <ul style={{listStyle:'none', display:'flex', flexDirection:'column', gap:11, marginBottom:28}}>
                    {f.bullets.map((b, bi) => (
                      <li key={bi} style={{display:'flex', gap:12, alignItems:'flex-start', fontSize:15, color:'var(--ink)', lineHeight:1.5}}>
                        <div style={{width:22, height:22, borderRadius:7, background:'var(--sage)', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--teal)'}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/login" className="btn btn-primary">
                    Try it free
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                </div>
                <div style={{order: f.reverse ? 1 : 2}}>
                  {f.visual}
                </div>
              </div>
            </div>
            <style>{`@media (max-width: 900px){ .feat-row{ grid-template-columns: 1fr !important; gap: 32px !important; } .feat-row > div{ order: unset !important; } }`}</style>
          </section>
          {i < FEATS.length - 1 && <WavyDivider />}
        </div>
      ))}

      <WavyDivider />

      {/* All features grid */}
      <section style={{background:'var(--ink)', color:'#fff', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 30% 20%, rgba(37,211,102,.12), transparent 40%), radial-gradient(circle at 70% 80%, rgba(106,79,182,.10), transparent 40%)`}}/>
        <div className="wrap" style={{position:'relative'}}>
          <div style={{maxWidth:680, marginBottom:48}}>
            <div className="eyebrow" style={{color:'#25D366'}}>The full list</div>
            <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', marginTop:12, color:'#fff'}}>Every feature, in one place.</h2>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:0}} className="all-feat-grid">
            {ALL_FEATURES.map(([emoji, t, d], i) => (
              <div key={t} style={{padding:'24px 24px 24px 0', borderTop:'1px solid rgba(255,255,255,.08)', borderRight: (i+1) % 3 ? '1px solid rgba(255,255,255,.08)' : 'none', paddingLeft: i % 3 ? 24 : 0}}>
                <div style={{fontSize:24, marginBottom:10}}>{emoji}</div>
                <h3 style={{fontSize:16, color:'#fff', marginBottom:6, letterSpacing:'-0.01em'}}>{t}</h3>
                <p style={{fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.5}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 900px){ .all-feat-grid{ grid-template-columns: 1fr 1fr !important; } }
          @media (max-width: 540px){ .all-feat-grid{ grid-template-columns: 1fr !important; } .all-feat-grid > div{ border-right: none !important; padding-left: 0 !important; } }
        `}</style>
      </section>

      <WavyDivider />

      {/* Closing CTA */}
      <section style={{background:'var(--bg)'}}>
        <div className="wrap" style={{textAlign:'center', maxWidth:720, margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(2rem, 3.6vw, 3.2rem)', color:'var(--ink)', letterSpacing:'-0.025em', marginBottom:18}}>
            Want to see it<br/>
            <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>on your WhatsApp?</span>
          </h2>
          <p style={{fontSize:17, color:'var(--ink-soft)', marginBottom:32, maxWidth:480, margin:'0 auto 32px'}}>
            Connect your WhatsApp Business number and watch your first AI reply happen in under 20 minutes. Free for 14 days.
          </p>
          <div style={{display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap'}}>
            <Link href="/auth/login" className="btn btn-primary" style={{padding:'16px 26px', fontSize:16}}>
              Start free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/pricing" className="btn btn-ghost" style={{padding:'16px 26px', fontSize:16}}>
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
