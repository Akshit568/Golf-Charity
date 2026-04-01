// src/components/layout/Navbar.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface NavbarProps {
  session?: { name: string; role: string } | null;
}

export default function Navbar({ session }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-brand-dark/95 backdrop-blur-xl border-b border-white/8' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center">
            <span className="text-brand-dark text-xs font-bold">F</span>
          </div>
          <span className="font-display text-lg font-light tracking-wide text-brand-cream group-hover:text-brand-gold transition-colors">
            Fairway <span className="text-brand-gold">&</span> Good
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/charities" className="text-sm text-brand-muted hover:text-brand-cream link-underline transition-colors">
            Charities
          </Link>
          <Link href="/#how-it-works" className="text-sm text-brand-muted hover:text-brand-cream link-underline transition-colors">
            How It Works
          </Link>
          {session?.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm text-brand-gold hover:text-amber-300 link-underline transition-colors">
              Admin
            </Link>
          )}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/subscribe">
                <Button size="sm">Join Now</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          <div className="w-5 h-px bg-brand-cream mb-1.5 transition-all" />
          <div className="w-5 h-px bg-brand-cream mb-1.5" />
          <div className="w-3 h-px bg-brand-cream" />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-brand-dark/98 border-b border-white/8 px-6 py-6 space-y-4">
          <Link href="/charities" className="block text-sm text-brand-muted hover:text-brand-cream">Charities</Link>
          <Link href="/#how-it-works" className="block text-sm text-brand-muted hover:text-brand-cream">How It Works</Link>
          {session ? (
            <>
              <Link href="/dashboard" className="block text-sm text-brand-cream">Dashboard</Link>
              <button onClick={handleLogout} className="block text-sm text-brand-muted">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-sm text-brand-muted">Sign In</Link>
              <Link href="/subscribe" className="block text-sm text-brand-gold font-medium">Join Now</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
