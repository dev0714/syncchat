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
          {' / use-cases'}
        </div>
        <h1 style={{fontSize:'clamp(2.4rem, 4.5vw, 4rem)', color:'var(--ink)', letterSpacing:'-0.03em', marginBottom:18, lineHeight:1.05}}>
          The same agent,{' '}
          <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>shaped to your business.</span>
        </h1>
        <p style={{fontSize:18, color:'var(--ink-soft)', maxWidth:640}}>
          Retail. Local services. Sales. Hospitality. The pattern is the same — the agent reads, looks up, takes action, replies in your tone.
        </p>
      </div>
    </div>
  );
}

type ChatMsg = { in?: string; out?: string; tool?: string };

function MiniChat({ messages, accent = '#075E54', bizName }: { messages: ChatMsg[]; accent?: string; bizName: string }) {
  return (
    <div style={{background:'#fff', borderRadius:20, overflow:'hidden', border:'1px solid var(--line)', boxShadow:'0 30px 60px -25px rgba(11,31,28,.2)', maxWidth:380, margin:'0 auto'}}>
      <div style={{background:accent, padding:'14px 16px', display:'flex', alignItems:'center', gap:10, color:'#fff'}}>
        <div style={{width:36, height:36, borderRadius:50, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14}}>AI</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14, fontWeight:600}}>{bizName}</div>
          <div style={{fontSize:11, opacity:.7}}>● AI agent · online</div>
        </div>
      </div>
      <div style={{
        backgroundColor:'#ECE5DD',
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='%23DDD2C3' fill-opacity='.35'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3Ccircle cx='50' cy='30' r='1'/%3E%3Ccircle cx='25' cy='55' r='1'/%3E%3Ccircle cx='65' cy='65' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        padding:'16px 12px', display:'flex', flexDirection:'column', gap:8, minHeight:340,
      }}>
        {messages.map((m, i) => {
          if (m.tool) return (
            <div key={i} style={{alignSelf:'center', background:'rgba(11,59,54,.92)', color:'#DCF8C6', fontFamily:"'JetBrains Mono'", fontSize:10, padding:'6px 10px', borderRadius:6, maxWidth:'88%', textAlign:'center', border:'1px solid rgba(37,211,102,.25)', lineHeight:1.4}}>
              <span style={{color:'#25D366', fontWeight:700}}>⚡</span> {m.tool}
            </div>
          );
          const isIn = !!m.in;
          return (
            <div key={i} style={{alignSelf: isIn ? 'flex-start' : 'flex-end', background: isIn ? '#fff' : '#D9FDD3', color:'#0B1F1C', padding:'8px 11px', borderRadius:12, borderBottomLeftRadius: isIn ? 4 : 12, borderBottomRightRadius: isIn ? 12 : 4, fontSize:13, lineHeight:1.4, maxWidth:'82%', boxShadow:'0 1px 1px rgba(0,0,0,.08)'}}>
              {m.in || m.out}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CASES = [
  {
    industry:'Retail & e-commerce',
    color:'#25D366', accent:'#075E54',
    headline:'Order status. Returns. Restocks.',
    headlineItalic:'Restocks.',
    intro:"Customers don't want to fill in a form to find their order. They WhatsApp. Your agent knows their history, checks live inventory, and creates holds — all on its own.",
    agentBrief:"Help shoppers track orders, check sizes, return items, and place holds. Be warm and quick. Hand off if it's an angry message or a refund over R5,000.",
    metrics:[['82%','Tickets auto-resolved'],['18s','Avg response time'],['3.2×','Conversion lift']],
    chat:[
      { in:"Hi! Did my order ship? #4821" },
      { tool:'Orders · Lookup #4821' },
      { out:"Hey Sarah! 📦 Yes — shipped yesterday with Aramex (AR-90234), arriving Thursday. Want SMS updates?" },
      { in:"Yes please. Also do you still have the Air Max in size 9?" },
      { tool:'Inventory · Check stock' },
      { out:"3 pairs left at V&A. Want me to hold one until you decide?" },
      { in:"Yes — until 6pm if possible 🙏" },
      { tool:'CRM · Create hold (exp 18:00)' },
      { out:"Done ✅ Held under your name. I'll ping you at 5pm so you don't forget." },
    ],
    alt:false,
  },
  {
    industry:'Local services',
    color:'#4FB1E0', accent:'#0369A1',
    headline:'Bookings, quotes, reminders — without picking up the phone.',
    intro:'Cleaning, plumbing, salons, training. Customers want to book in 30 seconds. The agent checks your calendar, sends quotes, and reminds them the day before.',
    agentBrief:"Book appointments only when slots are open. Send the standard quote based on service type and area. Confirm 24 hours before. Don't guarantee anything outside the calendar.",
    metrics:[['3×','More bookings on weekends'],['< 1min','Quote to booking'],['97%','Show-up rate']],
    chat:[
      { in:"Can I book a deep clean for Friday?" },
      { tool:'Calendar · Available slots' },
      { out:"Hi! Friday I have 9am or 2pm open. Which works for you?" },
      { in:"2pm. 3-bedroom in Sea Point — how much?" },
      { tool:'Pricing · Quote (3br, Sea Point)' },
      { out:"R850 for a 3-bedroom deep clean. Includes products. Sound good?" },
      { in:"Yep, book it" },
      { tool:'Calendar · Create booking' },
      { out:"Booked! 📅 Friday 2pm, R850. I'll send a reminder Thursday afternoon. Address please?" },
    ],
    alt:true,
  },
  {
    industry:'Sales & lead gen',
    color:'#6A4FB6', accent:'#5B21B6',
    headline:"Qualify leads while they're hot. Hand the warm ones over.",
    intro:"A lead lands at 11pm. The agent answers in 30 seconds, asks the three qualifying questions, and books a meeting straight into your sales rep's calendar.",
    agentBrief:'Ask 3 qualifying questions: company size, current solution, urgency. If they tick the boxes, book a 20-min discovery with our sales team. If not, send the self-serve guide.',
    metrics:[['< 30s','Lead response time'],['4.5×','Qualified meetings'],['62%','Books on first touch']],
    chat:[
      { in:"Saw your ad — interested in your platform" },
      { out:"Great to meet you! 👋 To point you at the right plan — roughly how big is your team?" },
      { in:"Around 40 people, growing fast" },
      { out:"Perfect fit for our Growth plan. What are you using right now?" },
      { in:"A mix of HubSpot + WhatsApp manually. It's getting messy" },
      { out:"Totally hear you. Are you looking to fix this in the next month, or just exploring?" },
      { in:"This month. We've lost two deals to slow replies." },
      { tool:'CRM · Score lead (HOT)' },
      { tool:'Calendar · Book 20min w/ Sarah' },
      { out:"Got it — booked you with Sarah our sales lead for tomorrow 11am. She'll have a tailored demo ready. ✅" },
    ],
    alt:false,
  },
  {
    industry:'Hospitality & travel',
    color:'#F4B740', accent:'#92400E',
    headline:'Check-in info, dining, late-night requests. All on chat.',
    intro:"Guests text the front desk WhatsApp at midnight: \"what's the WiFi password?\" The agent answers instantly, knows their room number, and logs requests for housekeeping.",
    agentBrief:'Answer common guest queries: WiFi, breakfast hours, dining, taxis. Log housekeeping requests with room number. Always escalate complaints to the duty manager.',
    metrics:[['< 15s','Late-night replies'],['+4★','Guest review score'],['68%','Housekeeping via WA']],
    chat:[
      { in:"Hi, can I get fresh towels delivered to room 412?" },
      { tool:'PMS · Verify room 412' },
      { tool:'Tasks · Create housekeeping ticket' },
      { out:"Of course! 🛏️ Fresh towels will be at your door within 15 minutes. Need anything else?" },
      { in:"What time does breakfast end?" },
      { out:"Breakfast runs until 10:30 in the Conservatory. We can also send it to your room if you prefer." },
      { in:"Room service please, 9am" },
      { tool:'Tasks · Schedule room service' },
      { out:"Booked — 9am, room 412. ☕ Will the usual continental work, or would you like the menu?" },
    ],
    alt:true,
  },
];

function ROI() {
  return (
    <section style={{padding:'80px 0', background:'var(--ink)', color:'#fff', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 30% 30%, rgba(37,211,102,.12), transparent 50%), radial-gradient(circle at 70% 70%, rgba(106,79,182,.10), transparent 50%)`}}/>
      <div className="wrap" style={{position:'relative'}}>
        <div style={{maxWidth:680, marginBottom:48}}>
          <div className="eyebrow" style={{color:'#25D366'}}>The math</div>
          <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', color:'#fff', letterSpacing:'-0.025em', marginTop:12}}>
            One Syncchat agent =<br/>
            <span style={{color:'#DCF8C6', fontStyle:'italic'}}>3 full-time support reps.</span>
          </h2>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:0}} className="roi-grid">
          {[
            ['10,000','Messages a day, comfortably','#25D366'],
            ['24/7','Always answering — no shifts','#6A4FB6'],
            ['R7,500','Monthly cost (Growth tier)','#F4B740'],
            ['R85K+','Saved vs 3 human reps','#4FB1E0'],
          ].map(([n, l, c], i) => (
            <div key={n} style={{padding: i === 0 ? '24px 24px 24px 0' : '24px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none'}}>
              <div style={{fontFamily:"'Bricolage Grotesque'", fontSize:'clamp(2rem, 3.2vw, 3rem)', fontWeight:700, color:c, letterSpacing:'-0.03em', lineHeight:1}}>{n}</div>
              <div style={{fontSize:13, color:'rgba(255,255,255,.65)', marginTop:10, lineHeight:1.5}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .roi-grid{ grid-template-columns: 1fr 1fr !important; gap: 24px !important;} .roi-grid > div{ border-left: none !important; padding: 24px 0 !important; border-top: 1px solid rgba(255,255,255,.1) !important; }}`}</style>
    </section>
  );
}

function Closing() {
  return (
    <section style={{padding:'96px 0', background:'var(--bg)'}}>
      <div className="wrap" style={{textAlign:'center', maxWidth:680, margin:'0 auto'}}>
        <h2 style={{fontSize:'clamp(2rem, 3.4vw, 3rem)', color:'var(--ink)', letterSpacing:'-0.025em', marginBottom:18}}>
          Your industry not here?<br/>
          <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>It probably still works.</span>
        </h2>
        <p style={{fontSize:17, color:'var(--ink-soft)', marginBottom:32, maxWidth:520, margin:'0 auto 32px'}}>
          If your customers WhatsApp you and you have a system the agent can talk to — we can build it.
        </p>
        <div style={{display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap'}}>
          <Link href="/contact" className="btn btn-primary" style={{padding:'16px 26px', fontSize:16}}>
            Talk to us
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href="/auth/login" className="btn btn-ghost" style={{padding:'16px 26px', fontSize:16}}>Start free trial</Link>
        </div>
      </div>
    </section>
  );
}

export default function UseCasesPage() {
  return (
    <div style={{background:'var(--bg)'}}>
      <Navbar />
      <PageHero />
      <WavyDivider />

      {CASES.map((c, i) => (
        <div key={c.industry}>
          <section style={{padding:'88px 0', background: c.alt ? 'var(--paper)' : 'var(--bg)', position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:-100, right:-100, width:280, height:280, background:`radial-gradient(circle, ${c.color}22, transparent 70%)`, filter:'blur(30px)', pointerEvents:'none'}}/>
            <div className="wrap" style={{position:'relative'}}>
              <div style={{display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:64, alignItems:'center'}} className="uc-row">
                <div>
                  <div style={{display:'inline-flex', alignItems:'center', gap:10, padding:'5px 12px 5px 5px', background:'var(--paper)', border:'1px solid var(--line)', borderRadius:50, marginBottom:24}}>
                    <div style={{width:28, height:28, borderRadius:50, background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono'", fontSize:11, fontWeight:700, color:'#fff'}}>0{i+1}</div>
                    <div style={{fontSize:12, fontWeight:600, color:'var(--ink-soft)', letterSpacing:'.02em'}}>{c.industry}</div>
                  </div>
                  <h2 style={{fontSize:'clamp(1.8rem, 3.4vw, 3rem)', color:'var(--ink)', letterSpacing:'-0.025em', marginBottom:18, lineHeight:1.1}}>{c.headline}</h2>
                  <p style={{fontSize:17, color:'var(--ink-soft)', marginBottom:24, maxWidth:480}}>{c.intro}</p>
                  <div style={{background:'var(--paper)', border:'1px solid var(--line)', borderRadius:14, padding:'14px 16px', marginBottom:24, borderLeft:`3px solid ${c.color}`}}>
                    <div style={{fontFamily:"'JetBrains Mono'", fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>Agent role</div>
                    <div style={{fontSize:13.5, color:'var(--ink-soft)', lineHeight:1.55, fontStyle:'italic'}}>"{c.agentBrief}"</div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginTop:8}}>
                    {c.metrics.map((m, mi) => (
                      <div key={mi}>
                        <div style={{fontFamily:"'Bricolage Grotesque'", fontSize:24, fontWeight:700, color:c.color, letterSpacing:'-0.02em'}}>{m[0]}</div>
                        <div style={{fontSize:11, color:'var(--muted)', marginTop:2, lineHeight:1.4}}>{m[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <MiniChat messages={c.chat} accent={c.accent} bizName={c.industry}/>
                </div>
              </div>
            </div>
            <style>{`@media (max-width: 900px){ .uc-row{ grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
          </section>
          {i < CASES.length - 1 && <WavyDivider />}
        </div>
      ))}

      <WavyDivider />
      <ROI />
      <WavyDivider />
      <Closing />
      <Footer />
    </div>
  );
}
