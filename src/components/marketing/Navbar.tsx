'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="mkt-nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="nav-logo-text">Sync<span>Chat</span></span>
        </Link>

        <div className={`nav-links${menuOpen ? ' open' : ''}`} id="navLinks">
          <Link href="/" className={pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/features" className={pathname === '/features' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Features</Link>
          <Link href="/pricing" className={pathname === '/pricing' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Pricing</Link>
          <Link href="/contact" className={pathname === '/contact' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Contact</Link>
        </div>

        <div className="nav-cta">
          <Link href="/auth/login" className="nav-login">Log in</Link>
          <Link href="/auth/login" className="nav-start">Get Started</Link>
        </div>

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
