'use client';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

const WavyDivider = () => (
  <div style={{width:'100%', height:1, background:'rgba(11,31,28,.14)'}} aria-hidden="true"/>
);

const TIERS = [
  { conv: 5000,  monthly: 2500 },
  { conv: 10000, monthly: 5000 },
  { conv: 15000, monthly: 7500 },
  { conv: 20000, monthly: 10000 },
];
const PLATFORM = 1500;

function fmt(n: number) { return 'R' + n.toLocaleString('en-ZA'); }

function PageHero() {
  return (
    <div className="page-hero-band">
      <div className="wrap">
        <div className="breadcrumb">
          <Link href="/" style={{color:'var(--teal-mid)'}}>home</Link>
          {' / pricing'}
        </div>
        <h1 style={{fontSize:'clamp(2.4rem, 4.5vw, 4rem)', color:'var(--ink)', letterSpacing:'-0.03em', marginBottom:18, lineHeight:1.05}}>
          Simple pricing. <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>No surprises.</span>
        </h1>
        <p style={{fontSize:18, color:'var(--ink-soft)', maxWidth:600}}>
          Two parts — the Platform (your CRM) and an optional AI Agent add-on. Slide to pick your conversation volume. Pay only for what you use.
        </p>
      </div>
    </div>
  );
}

function Calculator() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [tierIdx, setTierIdx] = useState(1);
  const [withAI, setWithAI] = useState(true);

  const disc  = isAnnual ? 0.8 : 1;
  const platM = Math.round(PLATFORM * disc);
  const aiM   = Math.round(TIERS[tierIdx].monthly * disc);
  const total = withAI ? platM + aiM : platM;
  const yearSaving = isAnnual
    ? ((PLATFORM + (withAI ? TIERS[tierIdx].monthly : 0)) * 12 - total * 12)
    : 0;

  return (
    <section style={{padding:'80px 0', background:'var(--paper)', borderBottom:'1px solid var(--line)'}}>
      <div className="wrap">
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:14, marginBottom:48}}>
          <span style={{fontSize:14, fontWeight:600, color: isAnnual ? 'var(--muted)' : 'var(--ink)'}}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            style={{
              width:52, height:28, borderRadius:14,
              background: isAnnual ? 'var(--green)' : 'var(--line)',
              position:'relative', transition:'background .2s',
            }}>
            <div style={{
              width:22, height:22, borderRadius:50, background:'#fff',
              position:'absolute', top:3, left: isAnnual ? 27 : 3,
              transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.15)',
            }}/>
          </button>
          <span style={{fontSize:14, fontWeight:600, color: isAnnual ? 'var(--ink)' : 'var(--muted)', display:'flex', alignItems:'center', gap:8}}>
            Annual
            <span style={{
              fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:50,
              background: isAnnual ? 'var(--sage)' : 'var(--bg)',
              color:'var(--teal)',
              border:'1px solid rgba(11,59,54,.12)',
            }}>Save 20%</span>
          </span>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:980, margin:'0 auto'}} className="pricing-grid">
          <div style={{
            background:'var(--paper)', border:'1px solid var(--line)',
            borderRadius:24, padding:32,
            display:'flex', flexDirection:'column',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20}}>
              <div style={{width:38, height:38, borderRadius:10, background:'var(--sage)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              <div>
                <div style={{fontSize:18, fontWeight:700, color:'var(--ink)', fontFamily:"'Bricolage Grotesque'"}}>Platform</div>
                <div style={{fontSize:12, color:'var(--muted)'}}>The WhatsApp Business CRM</div>
              </div>
            </div>
            <div style={{marginBottom:24}}>
              <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                <span style={{fontFamily:"'Bricolage Grotesque'", fontSize:48, fontWeight:700, color:'var(--ink)', letterSpacing:'-0.03em', lineHeight:1}}>{fmt(platM)}</span>
                <span style={{fontSize:14, color:'var(--muted)'}}>/ month</span>
              </div>
              {isAnnual && <div style={{fontSize:12, color:'var(--muted)', marginTop:6}}>{fmt(platM * 12)} billed annually</div>}
            </div>
            <ul style={{listStyle:'none', display:'flex', flexDirection:'column', gap:10, marginBottom:20, flex:1}}>
              {['WhatsApp messaging (Business API)','Up to 10 team members','Role-based access (Super/Admin/Agent/Viewer)','Bulk messaging campaigns','Message templates with variables','CSV contact import & tagging','Conversation inbox + history','Real-time dashboard','Multi-instance support'].map(f => (
                <li key={f} style={{display:'flex', gap:10, alignItems:'center', fontSize:14, color:'var(--ink-soft)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-bright)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <div style={{padding:'12px 14px', background:'var(--bg)', borderRadius:10, fontSize:12, color:'var(--muted)', fontFamily:"'JetBrains Mono'", borderLeft:'3px solid var(--green)'}}>
              <span style={{color:'var(--teal)'}}>✓</span> Always included. No add-on required.
            </div>
          </div>

          <div style={{
            background:'linear-gradient(165deg, #0B1F1C 0%, #1B312D 100%)',
            color:'#fff', border:'1px solid rgba(106,79,182,.4)',
            borderRadius:24, padding:32,
            display:'flex', flexDirection:'column',
            position:'relative', overflow:'hidden',
            boxShadow:'0 30px 60px -20px rgba(11,31,28,.4)',
          }}>
            <div style={{position:'absolute', top:-30, right:-30, width:200, height:200, background:'radial-gradient(circle, rgba(106,79,182,.3), transparent 70%)', filter:'blur(20px)', pointerEvents:'none'}}/>
            <div style={{position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{width:38, height:38, borderRadius:10, background:'#6A4FB6', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
                </div>
                <div>
                  <div style={{fontSize:18, fontWeight:700, color:'#fff', fontFamily:"'Bricolage Grotesque'"}}>AI Agent</div>
                  <div style={{fontSize:12, color:'rgba(255,255,255,.6)'}}>The autonomous brain</div>
                </div>
              </div>
              <span style={{fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:50, background:'#6A4FB6', color:'#fff', letterSpacing:'.05em'}}>ADD-ON</span>
            </div>
            <div style={{position:'relative', marginBottom:24}}>
              <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                <span style={{fontFamily:"'Bricolage Grotesque'", fontSize:48, fontWeight:700, color:'#C4B5FD', letterSpacing:'-0.03em', lineHeight:1}}>{fmt(aiM)}</span>
                <span style={{fontSize:14, color:'rgba(255,255,255,.55)'}}>/ month</span>
              </div>
              <div style={{fontSize:12, color:'rgba(255,255,255,.55)', marginTop:6}}>{TIERS[tierIdx].conv.toLocaleString()} AI conversations / month</div>
            </div>
            <div style={{position:'relative', marginBottom:20}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,.55)', marginBottom:8, fontFamily:"'JetBrains Mono'", textTransform:'uppercase', letterSpacing:'.06em'}}>
                <span>Tier</span>
                <span style={{color:'#C4B5FD', fontWeight:700}}>{TIERS[tierIdx].conv.toLocaleString()} conv</span>
              </div>
              <input type="range" min="0" max="3" step="1" value={tierIdx} onChange={e => setTierIdx(parseInt(e.target.value))} style={{width:'100%', accentColor:'#6A4FB6', cursor:'pointer', height:6}}/>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6, marginTop:10}}>
                {TIERS.map((t, i) => (
                  <button key={i} onClick={() => setTierIdx(i)} style={{padding:'7px 4px', borderRadius:8, background: tierIdx === i ? '#6A4FB6' : 'rgba(255,255,255,.04)', border: tierIdx === i ? '1px solid #6A4FB6' : '1px solid rgba(255,255,255,.1)', color: tierIdx === i ? '#fff' : 'rgba(255,255,255,.6)', fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono'"}}>{t.conv >= 1000 ? `${t.conv/1000}k` : t.conv}</button>
                ))}
              </div>
            </div>
            <ul style={{position:'relative', listStyle:'none', display:'flex', flexDirection:'column', gap:10, marginBottom:20, flex:1}}>
              {['AI agent prompt builder','Role, guardrails, tone, business context','Selectable AI tools (CRM, inventory, etc.)','Keyword & event triggers','24/7 automated responses','Conversation count tracking'].map(f => (
                <li key={f} style={{display:'flex', gap:10, alignItems:'center', fontSize:14, color:'rgba(255,255,255,.85)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <label style={{position:'relative', display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'rgba(255,255,255,.04)', borderRadius:10, cursor:'pointer', border:'1px solid rgba(255,255,255,.08)'}}>
              <input type="checkbox" checked={withAI} onChange={e => setWithAI(e.target.checked)} style={{accentColor:'#6A4FB6', width:16, height:16, cursor:'pointer'}}/>
              <span style={{fontSize:13, color:'rgba(255,255,255,.85)'}}>Include AI Agent in my total</span>
            </label>
          </div>
        </div>

        <div style={{maxWidth:980, margin:'24px auto 0'}}>
          <div style={{background:'linear-gradient(135deg, var(--teal) 0%, var(--teal-deep) 100%)', borderRadius:24, padding:'36px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:32, flexWrap:'wrap', position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:-50, left:'40%', width:300, height:300, background:'radial-gradient(circle, rgba(37,211,102,.18), transparent 70%)', filter:'blur(30px)'}}/>
            <div style={{position:'relative'}}>
              <div style={{fontSize:13, color:'rgba(255,255,255,.65)', marginBottom:8, fontFamily:"'JetBrains Mono'", letterSpacing:'.06em', textTransform:'uppercase'}}>Your total</div>
              <div style={{display:'flex', alignItems:'baseline', gap:10}}>
                <span style={{fontFamily:"'Bricolage Grotesque'", fontSize:56, fontWeight:700, color:'#fff', letterSpacing:'-0.03em', lineHeight:1}}>{fmt(total)}</span>
                <span style={{fontSize:16, color:'rgba(255,255,255,.65)'}}>/ month</span>
              </div>
              <div style={{fontSize:13, color:'rgba(255,255,255,.7)', marginTop:10}}>Platform {fmt(platM)}{withAI && ` + AI ${TIERS[tierIdx].conv.toLocaleString()} conv. ${fmt(aiM)}`}</div>
              {isAnnual && yearSaving > 0 && (
                <div style={{marginTop:14, display:'inline-flex', alignItems:'center', gap:6, background:'rgba(37,211,102,.18)', color:'#DCF8C6', padding:'5px 12px', borderRadius:50, fontSize:12, fontWeight:600, border:'1px solid rgba(37,211,102,.3)'}}>
                  🎉 You save {fmt(yearSaving)} / year
                </div>
              )}
            </div>
            <div style={{position:'relative', display:'flex', flexDirection:'column', gap:10}}>
              <Link href="/auth/login" className="btn btn-green" style={{padding:'16px 26px', fontSize:16}}>
                Start free trial
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <div style={{fontSize:11, color:'rgba(255,255,255,.55)', textAlign:'center'}}>14 days free · no card</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .pricing-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

const COMP_ROWS: [string, boolean | null | string, boolean | string][] = [
  ['WhatsApp Business messaging',true,false],['Up to 10 team members',true,false],['Role-based access control',true,false],['Contact management & CSV import',true,false],['Message templates',true,false],['Bulk campaign sending',true,false],['Conversation inbox',true,false],['Real-time dashboard & stats',true,false],['Multi-instance support',true,false],['Scheduled bulk (one-time + recurring)',true,false],['AI agent builder (role, guardrails, tone)',false,true],['AI flows & automation triggers',false,true],['Selectable AI tools (CRM, inventory)',false,true],['AI conversations / month',null,'5k – 20k'],['24/7 automated responses',false,true],['Conversation memory per contact',false,true],
];

function Comparison() {
  return (
    <section style={{background:'var(--bg)'}}>
      <div className="wrap">
        <div style={{textAlign:'center', maxWidth:680, margin:'0 auto 56px'}}>
          <div className="eyebrow">Compare</div>
          <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', marginTop:12, color:'var(--ink)'}}>What&apos;s in each plan.</h2>
        </div>
        <div style={{background:'var(--paper)', border:'1px solid var(--line)', borderRadius:18, overflow:'hidden', boxShadow:'0 10px 30px -15px rgba(11,31,28,.1)'}}>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:0, padding:'18px 28px', background:'var(--ink)', color:'#fff'}}>
            <div style={{fontSize:11, fontFamily:"'JetBrains Mono'", letterSpacing:'.08em', textTransform:'uppercase', color:'rgba(255,255,255,.6)'}}>Feature</div>
            <div style={{fontSize:13, fontWeight:700, textAlign:'center'}}>Platform</div>
            <div style={{fontSize:13, fontWeight:700, textAlign:'center', color:'#C4B5FD'}}>AI Agent</div>
          </div>
          {COMP_ROWS.map((r, i) => (
            <div key={i} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', padding:'14px 28px', borderBottom: i < COMP_ROWS.length-1 ? '1px solid var(--line-soft)' : 'none', alignItems:'center', background: i % 2 ? 'var(--bg)' : 'transparent', fontSize:14}}>
              <div style={{color:'var(--ink)', fontWeight:500}}>{r[0]}</div>
              <div style={{textAlign:'center', color: r[1] === true ? 'var(--green-bright)' : 'var(--line)', fontSize:16}}>{r[1] === true ? '✓' : r[1] === null ? '—' : '—'}</div>
              <div style={{textAlign:'center', color: r[2] === true ? 'var(--green-bright)' : typeof r[2] === 'string' ? 'var(--ink)' : 'var(--line)', fontWeight: typeof r[2] === 'string' ? 600 : 'normal', fontSize: typeof r[2] === 'string' ? 13 : 16}}>{r[2] === true ? '✓' : r[2] === false ? '—' : r[2]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS: [string, string][] = [
  ['What counts as an AI conversation?','A single AI-handled WhatsApp thread within a 24-hour window. Human-agent replies do not count toward your AI usage — only autonomous AI responses.'],
  ['Can I change my conversation tier?','Yes — upgrade or downgrade anytime. Changes take effect at the start of your next billing period.'],
  ['What happens if I exceed my limit?',"You'll get a notification and the AI agent pauses until you upgrade or the next period begins. Your human team can still use the platform normally."],
  ['Do I need the AI add-on?',"No. The Platform plan gives you full WhatsApp messaging, team management, bulk sending and templates. The AI Agent is optional — add it when you're ready to automate."],
  ['What payment methods are accepted?','All major credit and debit cards. EFT and invoicing available for annual plans on request.'],
  ['Is there a free trial?','14 days free, no credit card. Both Platform and AI Agent are included in the trial.'],
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section style={{background:'var(--paper)'}}>
      <div className="wrap" style={{maxWidth:880, margin:'0 auto'}}>
        <div style={{textAlign:'center', marginBottom:48}}>
          <div className="eyebrow">FAQ</div>
          <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', marginTop:12, color:'var(--ink)'}}>Questions worth asking.</h2>
        </div>
        <div>
          {FAQS.map(([q, a], i) => (
            <div key={i} style={{borderTop:'1px solid var(--line)', borderBottom: i === FAQS.length-1 ? '1px solid var(--line)' : 'none'}}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'22px 0', textAlign:'left', fontSize:17, fontWeight:600, color:'var(--ink)', letterSpacing:'-0.005em'}}>
                {q}
                <span style={{width:28, height:28, borderRadius:50, background: open === i ? 'var(--ink)' : 'transparent', color: open === i ? '#fff' : 'var(--ink)', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0}}>{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <div style={{paddingBottom:22, fontSize:15, color:'var(--ink-soft)', lineHeight:1.65, maxWidth:680}}>{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PricingPage() {
  return (
    <div style={{background:'var(--bg)'}}>
      <Navbar />
      <PageHero />
      <WavyDivider />
      <Calculator />
      <WavyDivider />
      <Comparison />
      <WavyDivider />
      <FAQ />
      <Footer />
    </div>
  );
}
