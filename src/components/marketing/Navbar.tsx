'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Use cases', href: '/use-cases' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Docs', href: '/docs' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      position:'sticky', top:0, zIndex:50,
      background:'rgba(251,250,246,.85)',
      backdropFilter:'blur(12px)',
      borderBottom:'1px solid var(--line-soft)',
    }}>
      <div className="wrap" style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:68,
      }}>
        <Link href="/" style={{display:'flex', alignItems:'center', gap:10, textDecoration:'none'}}>
          <div style={{
            width:32, height:32, borderRadius:9,
            background:'var(--ink)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </div>
          <div style={{fontFamily:"'Bricolage Grotesque', system-ui, sans-serif", fontWeight:700, fontSize:18, letterSpacing:'-0.015em', color:'var(--ink)'}}>
            syncchat
          </div>
        </Link>

        <nav style={{display:'flex', alignItems:'center', gap:4}} className="mkt-nav-links">
          {NAV_LINKS.map(l => {
            const active = pathname === l.href;
            return (
              <Link key={l.label} href={l.href} style={{
                padding:'8px 14px', borderRadius:8,
                fontSize:14, fontWeight: active ? 700 : 500,
                color: active ? 'var(--ink)' : 'var(--ink-soft)',
                background: active ? 'var(--paper)' : 'transparent',
                border: active ? '1px solid var(--line)' : '1px solid transparent',
                textDecoration:'none',
              }}>{l.label}</Link>
            );
          })}
        </nav>

        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <Link href="/auth/login" style={{fontSize:14, fontWeight:600, color:'var(--ink-soft)', padding:'8px 14px', textDecoration:'none'}} className="mkt-nav-links">Log in</Link>
          <Link href="/auth/login" style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'10px 16px', borderRadius:10,
            background:'var(--ink)', color:'#fff',
            fontSize:14, fontWeight:600, textDecoration:'none',
          }}>
            Start free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display:'none', padding:6,
              background:'none', border:'none', cursor:'pointer',
            }}
            className="mkt-hamburger"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{
          background:'var(--paper)', borderTop:'1px solid var(--line)',
          padding:'12px 20px 16px', display:'flex', flexDirection:'column', gap:4,
        }}>
          {NAV_LINKS.map(l => (
            <Link key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={{
              padding:'10px 14px', borderRadius:8, fontSize:15, fontWeight:500,
              color:'var(--ink-soft)', textDecoration:'none',
            }}>{l.label}</Link>
          ))}
          <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{
            padding:'10px 14px', borderRadius:8, fontSize:15, fontWeight:600,
            color:'var(--teal)', textDecoration:'none', marginTop:4,
          }}>Log in</Link>
        </div>
      )}

      <style>{`
        @media (max-width: 900px){
          .mkt-nav-links{ display:none !important; }
          .mkt-hamburger{ display:flex !important; }
        }
      `}</style>
    </header>
  );
}
