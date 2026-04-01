// src/app/login/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Login failed');
      return;
    }

    if (data.user.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark bg-grid flex flex-col items-center justify-center px-6">
      {/* Ambient */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-green/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-12 group">
          <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center">
            <span className="text-brand-dark text-xs font-bold">F</span>
          </div>
          <span className="font-display text-lg font-light text-brand-cream group-hover:text-brand-gold transition-colors">
            Fairway <span className="text-brand-gold">&</span> Good
          </span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 md:p-10">
          <h1 className="font-display text-3xl font-light text-brand-cream mb-1">Welcome back</h1>
          <p className="text-sm text-brand-muted mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />

            <Button type="submit" loading={loading} className="w-full mt-6" size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-brand-muted mt-6">
            Don't have an account?{' '}
            <Link href="/subscribe" className="text-brand-gold hover:text-amber-300 transition-colors">
              Join Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
