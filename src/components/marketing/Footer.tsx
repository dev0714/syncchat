import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{background:'var(--ink)', color:'rgba(255,255,255,.7)'}}>
      <div className="wrap" style={{padding:'64px 32px 32px'}}>
        {/* Top grid */}
        <div style={{
          display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr',
          gap:48, marginBottom:48,
        }} className="footer-top-grid">
          {/* Brand */}
          <div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:18}}>
              <div style={{
                width:34, height:34, borderRadius:9, background:'var(--teal-deep)',
                border:'1px solid rgba(37,211,102,.2)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <span style={{fontFamily:"'Bricolage Grotesque', system-ui, sans-serif", fontWeight:700, fontSize:17, color:'#fff', letterSpacing:'-0.015em'}}>syncchat</span>
            </div>
            <p style={{fontSize:14, lineHeight:1.7, maxWidth:280, color:'rgba(255,255,255,.6)', marginBottom:20}}>
              Your WhatsApp Business number, on autopilot — powered by an AI agent that reads, thinks, and replies in your tone.
            </p>
            {/* Social icons */}
            <div style={{display:'flex', gap:10}}>
              {[
                {
                  label:'Twitter',
                  svg:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.3 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>,
                },
                {
                  label:'LinkedIn',
                  svg:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
                },
                {
                  label:'GitHub',
                  svg:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
                },
              ].map(s => (
                <a key={s.label} href="#" aria-label={s.label} style={{
                  width:32, height:32, borderRadius:8,
                  background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'rgba(255,255,255,.6)', transition:'color .15s, background .15s',
                }}>
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:16}}>Product</h4>
            <ul style={{listStyle:'none', display:'flex', flexDirection:'column', gap:10}}>
              {[
                { label:'Features', href:'/features' },
                { label:'Pricing', href:'/pricing' },
                { label:'Use cases', href:'/use-cases' },
                { label:'Docs', href:'/docs' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} style={{color:'rgba(255,255,255,.6)', fontSize:14, transition:'color .15s'}}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:16}}>Company</h4>
            <ul style={{listStyle:'none', display:'flex', flexDirection:'column', gap:10}}>
              {[
                { label:'About', href:'/about' },
                { label:'Contact', href:'/contact' },
                { label:'Customers', href:'/use-cases' },
                { label:'Blog', href:'#' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} style={{color:'rgba(255,255,255,.6)', fontSize:14, transition:'color .15s'}}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:16}}>Legal</h4>
            <ul style={{listStyle:'none', display:'flex', flexDirection:'column', gap:10}}>
              {[
                { label:'Privacy', href:'#' },
                { label:'Terms', href:'#' },
                { label:'POPIA', href:'#' },
                { label:'Status', href:'#' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} style={{color:'rgba(255,255,255,.6)', fontSize:14, transition:'color .15s'}}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          paddingTop:28, borderTop:'1px solid rgba(255,255,255,.08)',
          fontSize:13, color:'rgba(255,255,255,.4)', flexWrap:'wrap', gap:12,
        }}>
          <span>© 2026 Syncchat · Made in 🇿🇦</span>
          <div style={{display:'flex', alignItems:'center', gap:6}}>
            <span style={{width:6, height:6, borderRadius:50, background:'#25D366', display:'inline-block'}}/>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){
          .footer-top-grid{ grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 540px){
          .footer-top-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
