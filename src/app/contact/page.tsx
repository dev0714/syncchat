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
          {' / contact'}
        </div>
        <h1 style={{fontSize:'clamp(2.4rem, 4.5vw, 4rem)', color:'var(--ink)', letterSpacing:'-0.03em', marginBottom:18, lineHeight:1.05}}>
          Get in touch.{' '}
          <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>Yes, on WhatsApp too.</span>
        </h1>
        <p style={{fontSize:18, color:'var(--ink-soft)', maxWidth:600}}>
          Sales, support, partnerships — pick whichever channel suits you. Our own AI agent answers WhatsApp instantly; humans handle the trickier bits.
        </p>
      </div>
    </div>
  );
}

type FormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
};

function Field({ label, value, onChange, placeholder, type = 'text', required, textarea }: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const commonStyle: React.CSSProperties = {
    width:'100%', padding:'12px 14px', borderRadius:10,
    border:'1px solid var(--line)', background:'var(--paper)',
    fontSize:14, color:'var(--ink)', fontFamily:'inherit', outline:'none',
    transition:'border-color .15s, box-shadow .15s',
  };
  return (
    <label style={{display:'flex', flexDirection:'column', gap:6}}>
      <span style={{fontSize:12, fontWeight:600, color:'var(--ink-soft)', fontFamily:"'JetBrains Mono'", textTransform:'uppercase', letterSpacing:'.06em'}}>{label}</span>
      {textarea ? (
        <textarea rows={5} value={value} onChange={onChange} placeholder={placeholder} required={required} style={commonStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.boxShadow = '0 0 0 3px rgba(7,94,84,.08)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.boxShadow = 'none'; }}
        />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} style={commonStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.boxShadow = '0 0 0 3px rgba(7,94,84,.08)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.boxShadow = 'none'; }}
        />
      )}
    </label>
  );
}

function ContactSection() {
  const [form, setForm] = useState<FormState>({ name:'', company:'', email:'', phone:'', topic:'sales', message:'' });
  const [sent, setSent] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({...form, [k]: e.target.value});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section style={{padding:'80px 0', background:'var(--paper)'}}>
      <div className="wrap">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:64, alignItems:'start'}} className="contact-grid">
          <div>
            <h2 style={{fontSize:'clamp(1.8rem, 3vw, 2.4rem)', color:'var(--ink)', letterSpacing:'-0.02em', marginBottom:16}}>
              We&apos;d love to hear from you.
            </h2>
            <p style={{fontSize:16, color:'var(--ink-soft)', marginBottom:36, maxWidth:380}}>
              Pick whichever channel suits you. The AI agent answers WhatsApp instantly; for sales or detailed enquiries, email gets you a human within the hour during business hours.
            </p>

            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              {[
                { icon:'wa', t:'WhatsApp', d:'+27 82 555 0123', sub:'AI answers immediately, 24/7', accent:'#25D366', bg:'var(--sage)' },
                { icon:'mail', t:'Email', d:'hello@syncchat.co.za', sub:'Replies within an hour, 09:00–17:00 SAST', accent:'#0369A1', bg:'#DBEEF8' },
                { icon:'office', t:'Office', d:'Cape Town · 8th floor', sub:'21 Bree Street, City Centre, 8001', accent:'#92400E', bg:'#FFF1CC' },
              ].map(c => (
                <a key={c.t} href="#" style={{display:'flex', alignItems:'center', gap:14, padding:16, background:'var(--bg)', borderRadius:14, border:'1px solid var(--line)'}}>
                  <div style={{width:44, height:44, borderRadius:11, background:c.bg, color:c.accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    {c.icon === 'wa' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>}
                    {c.icon === 'mail' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                    {c.icon === 'office' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:12, color:'var(--muted)', fontFamily:"'JetBrains Mono'", textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600}}>{c.t}</div>
                    <div style={{fontSize:15, fontWeight:600, color:'var(--ink)', marginTop:2}}>{c.d}</div>
                    <div style={{fontSize:12, color:'var(--muted)', marginTop:2}}>{c.sub}</div>
                  </div>
                </a>
              ))}
            </div>

            <div style={{marginTop:28, background:'#0B1F1C', color:'#fff', borderRadius:18, padding:24, position:'relative', overflow:'hidden'}}>
              <div style={{position:'absolute', top:-30, right:-30, width:160, height:160, background:'radial-gradient(circle, rgba(37,211,102,.25), transparent 70%)', filter:'blur(20px)'}}/>
              <div style={{position:'relative'}}>
                <div className="chip" style={{background:'rgba(37,211,102,.15)', color:'#25D366', border:'1px solid rgba(37,211,102,.3)', marginBottom:14}}>
                  <span className="pulse"/> Try it now
                </div>
                <h3 style={{fontSize:18, color:'#fff', letterSpacing:'-0.01em', marginBottom:8, fontFamily:"'Bricolage Grotesque'"}}>Test the agent on WhatsApp.</h3>
                <p style={{fontSize:13, color:'rgba(255,255,255,.7)', marginBottom:16, lineHeight:1.55}}>
                  Send &ldquo;demo&rdquo; to +27 82 555 0123 and you&apos;ll get a live conversation with our actual agent — same one our customers use.
                </p>
                <a href="https://wa.me/27825550123?text=demo" className="btn btn-green" style={{padding:'10px 16px', fontSize:13, borderRadius:10}}>Open WhatsApp →</a>
              </div>
            </div>
          </div>

          <div style={{background:'var(--bg)', border:'1px solid var(--line)', borderRadius:24, padding:36, position:'relative', overflow:'hidden'}}>
            {sent ? (
              <div style={{textAlign:'center', padding:'40px 0'}}>
                <div style={{width:72, height:72, borderRadius:50, background:'var(--sage)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{fontSize:24, color:'var(--ink)', letterSpacing:'-0.02em', marginBottom:10, fontFamily:"'Bricolage Grotesque'"}}>Message received ✅</h3>
                <p style={{fontSize:15, color:'var(--ink-soft)', marginBottom:24}}>
                  Thanks {form.name.split(' ')[0] || 'there'}. We&apos;ll get back to you within the hour.
                </p>
                <button onClick={() => { setSent(false); setForm({name:'',company:'',email:'',phone:'',topic:'sales',message:''}); }}
                  className="btn btn-ghost" style={{padding:'12px 22px'}}>
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:18}}>
                <div>
                  <h3 style={{fontSize:22, color:'var(--ink)', letterSpacing:'-0.02em', marginBottom:6, fontFamily:"'Bricolage Grotesque'"}}>Send us a message.</h3>
                  <p style={{fontSize:13, color:'var(--muted)'}}>We typically reply within the hour, 09:00–17:00 SAST.</p>
                </div>

                <div>
                  <div style={{fontSize:12, fontWeight:600, color:'var(--ink-soft)', marginBottom:8, fontFamily:"'JetBrains Mono'", textTransform:'uppercase', letterSpacing:'.06em'}}>What&apos;s up?</div>
                  <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                    {[['sales','Sales enquiry'],['support','Support'],['demo','Book a demo'],['partner','Partnership'],['other','Something else']].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setForm({...form, topic:v})}
                        style={{padding:'7px 14px', borderRadius:50, background: form.topic === v ? 'var(--ink)' : 'var(--paper)', color: form.topic === v ? '#fff' : 'var(--ink-soft)', border: `1px solid ${form.topic === v ? 'var(--ink)' : 'var(--line)'}`, fontSize:13, fontWeight:500}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}} className="form-grid">
                  <Field label="Your name" value={form.name} onChange={set('name')} placeholder="Sarah Khumalo" required/>
                  <Field label="Company" value={form.company} onChange={set('company')} placeholder="Acme Retail"/>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}} className="form-grid">
                  <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="sarah@acme.co.za" required/>
                  <Field label="Phone (WhatsApp)" type="tel" value={form.phone} onChange={set('phone')} placeholder="+27 82 ..."/>
                </div>
                <Field label="Message" textarea value={form.message} onChange={set('message')} placeholder="Tell us a bit about what you're trying to do..." required/>

                <button type="submit" className="btn btn-primary" style={{justifyContent:'center', padding:'16px 22px', fontSize:15, marginTop:4}}>
                  Send message
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
                <div style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--muted)', justifyContent:'center'}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  We never share your details. POPIA-compliant.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ .contact-grid{ grid-template-columns: 1fr !important; gap: 40px !important;} .form-grid{ grid-template-columns: 1fr !important;} }
      `}</style>
    </section>
  );
}

function Hours() {
  return (
    <section style={{padding:'72px 0', background:'var(--bg)'}}>
      <div className="wrap">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, alignItems:'center'}} className="hours-grid">
          <div>
            <div className="eyebrow">Hours</div>
            <h2 style={{fontSize:'clamp(1.6rem, 2.6vw, 2.4rem)', color:'var(--ink)', letterSpacing:'-0.02em', marginTop:12, marginBottom:18}}>
              Humans Mon–Fri.<br/>
              <span style={{color:'var(--teal-mid)', fontStyle:'italic'}}>AI always.</span>
            </h2>
            <div style={{display:'flex', flexDirection:'column', gap:10, maxWidth:340}}>
              {[['Monday – Friday','09:00 – 17:00 SAST'],['Saturday','10:00 – 14:00 SAST'],['Sunday','AI only'],['Public holidays','AI only']].map(([d, h]) => (
                <div key={d} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--line-soft)', fontSize:14}}>
                  <span style={{fontWeight:500, color:'var(--ink)'}}>{d}</span>
                  <span style={{color:'var(--ink-soft)', fontFamily:"'JetBrains Mono'", fontSize:13}}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:'linear-gradient(135deg, #DCF8C6 0%, #B6E8D4 100%)', borderRadius:20, padding:32, height:260, position:'relative', overflow:'hidden', border:'1px solid var(--line)'}}>
            <svg viewBox="0 0 400 260" preserveAspectRatio="none" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
              <g stroke="rgba(11,59,54,.08)" strokeWidth="1">
                <line x1="0" y1="50" x2="400" y2="80"/><line x1="0" y1="130" x2="400" y2="160"/><line x1="0" y1="200" x2="400" y2="230"/>
                <line x1="80" y1="0" x2="60" y2="260"/><line x1="200" y1="0" x2="180" y2="260"/><line x1="320" y1="0" x2="300" y2="260"/>
              </g>
              <path d="M 0 140 Q 100 100 200 130 T 400 110" fill="none" stroke="rgba(11,59,54,.12)" strokeWidth="3"/>
              <path d="M 0 170 Q 80 200 180 180 T 400 200" fill="none" stroke="rgba(11,59,54,.12)" strokeWidth="3"/>
            </svg>
            <div style={{position:'absolute', top:'45%', left:'45%', transform:'translate(-50%, -100%)'}}>
              <div style={{width:48, height:48, borderRadius:'50% 50% 50% 0', background:'var(--green)', transform:'rotate(-45deg)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 20px rgba(7,94,84,.3)'}}>
                <div style={{transform:'rotate(45deg)'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#075E54" strokeWidth="2.4" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
              </div>
            </div>
            <div style={{position:'absolute', bottom:24, left:24, background:'var(--paper)', padding:'10px 14px', borderRadius:10, border:'1px solid var(--line)', boxShadow:'0 4px 12px rgba(11,31,28,.08)'}}>
              <div style={{fontSize:11, color:'var(--muted)', fontFamily:"'JetBrains Mono'", textTransform:'uppercase', letterSpacing:'.06em'}}>HQ</div>
              <div style={{fontSize:13, fontWeight:600, color:'var(--ink)'}}>Cape Town · Bree St</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .hours-grid{ grid-template-columns: 1fr !important; gap: 32px !important;}}`}</style>
    </section>
  );
}

export default function ContactPage() {
  return (
    <div style={{background:'var(--bg)'}}>
      <Navbar />
      <PageHero />
      <WavyDivider />
      <ContactSection />
      <WavyDivider />
      <Hours />
      <Footer />
    </div>
  );
}
