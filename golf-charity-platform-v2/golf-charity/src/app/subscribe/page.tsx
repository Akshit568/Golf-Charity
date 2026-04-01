// src/app/subscribe/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Input, Card, Badge } from '@/components/ui';
import { Check, Heart } from 'lucide-react';

interface Charity {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
}

type Step = 'account' | 'plan' | 'charity' | 'checkout';

export default function SubscribePage() {
  const [step, setStep] = useState<Step>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [charities, setCharities] = useState<Charity[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    charityId: '',
    charityPercent: 10,
  });

  useEffect(() => {
    fetch('/api/charities').then(r => r.json()).then(d => setCharities(d.charities ?? []));
  }, []);

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Signup failed');
      return;
    }
    setStep('plan');
  }

  async function handleCheckout() {
    setLoading(true);
    setError('');

    const res = await fetch('/api/subscribe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: form.plan,
        charityId: form.charityId,
        charityPercent: form.charityPercent,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Checkout failed');
      return;
    }
    window.location.href = data.url;
  }

  const steps = ['account', 'plan', 'charity', 'checkout'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-brand-dark bg-grid flex flex-col items-center justify-center px-6 py-20">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-green/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-10 group">
          <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center">
            <span className="text-brand-dark text-xs font-bold">F</span>
          </div>
          <span className="font-display text-lg font-light text-brand-cream group-hover:text-brand-gold transition-colors">
            Fairway <span className="text-brand-gold">&</span> Good
          </span>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                i < stepIndex ? 'bg-brand-green border-brand-sage text-white' :
                i === stepIndex ? 'bg-brand-gold text-brand-dark' :
                'bg-white/5 border border-white/10 text-brand-muted'
              }`}>
                {i < stepIndex ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${i < stepIndex ? 'bg-brand-green' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* ── Step 1: Account ────────────────────────────────────────────── */}
        {step === 'account' && (
          <Card className="p-8">
            <h2 className="font-display text-3xl font-light mb-1">Create your account</h2>
            <p className="text-sm text-brand-muted mb-8">First, let's get you set up</p>
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <Input id="name" label="Full Name" placeholder="Alex Ferguson" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <Input id="email" label="Email" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Input id="password" label="Password" type="password" placeholder="Min 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
                Continue
              </Button>
            </form>
            <p className="text-center text-sm text-brand-muted mt-5">
              Already a member?{' '}
              <Link href="/login" className="text-brand-gold hover:text-amber-300 transition-colors">Sign In</Link>
            </p>
          </Card>
        )}

        {/* ── Step 2: Plan ───────────────────────────────────────────────── */}
        {step === 'plan' && (
          <Card className="p-8">
            <h2 className="font-display text-3xl font-light mb-1">Choose your plan</h2>
            <p className="text-sm text-brand-muted mb-8">Both plans enter you into every monthly draw</p>
            <div className="space-y-4">
              {[
                { id: 'MONTHLY', label: 'Monthly', price: '£9.99', period: '/month', saving: null },
                { id: 'YEARLY',  label: 'Yearly',  price: '£99',   period: '/year',  saving: 'Save £20.88' },
              ].map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setForm(f => ({ ...f, plan: plan.id as any }))}
                  className={`w-full p-5 rounded-xl border text-left transition-all ${
                    form.plan === plan.id
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-brand-cream">{plan.label}</div>
                      {plan.saving && (
                        <div className="text-xs text-green-400 mt-0.5">{plan.saving}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl text-brand-gold">{plan.price}</div>
                      <div className="text-xs text-brand-muted">{plan.period}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Button onClick={() => setStep('charity')} size="lg" className="w-full mt-6">
              Continue
            </Button>
          </Card>
        )}

        {/* ── Step 3: Charity ────────────────────────────────────────────── */}
        {step === 'charity' && (
          <Card className="p-8">
            <h2 className="font-display text-3xl font-light mb-1">Choose your cause</h2>
            <p className="text-sm text-brand-muted mb-6">At least 10% of your subscription goes here</p>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
              {charities.length === 0 && (
                <p className="text-sm text-brand-muted text-center py-4">No charities listed yet</p>
              )}
              {charities.map(c => (
                <button
                  key={c.id}
                  onClick={() => setForm(f => ({ ...f, charityId: c.id }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    form.charityId === c.id
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-green/40 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-brand-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-brand-cream">{c.name}</div>
                      <div className="text-xs text-brand-muted line-clamp-1">{c.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-brand-warm/80 mb-2">
                Donation percentage: <span className="text-brand-gold font-mono">{form.charityPercent}%</span>
              </label>
              <input
                type="range" min={10} max={50} step={5}
                value={form.charityPercent}
                onChange={e => setForm(f => ({ ...f, charityPercent: +e.target.value }))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-xs text-brand-muted mt-1">
                <span>10% (min)</span><span>50%</span>
              </div>
            </div>

            <Button
              onClick={() => setStep('checkout')}
              size="lg" className="w-full"
              disabled={!form.charityId}
            >
              Continue
            </Button>
          </Card>
        )}

        {/* ── Step 4: Checkout ───────────────────────────────────────────── */}
        {step === 'checkout' && (
          <Card className="p-8">
            <h2 className="font-display text-3xl font-light mb-1">Review &amp; Pay</h2>
            <p className="text-sm text-brand-muted mb-8">You're almost in the game</p>

            <div className="space-y-3 mb-8">
              {[
                { label: 'Plan',      value: form.plan === 'MONTHLY' ? '£9.99/month' : '£99/year' },
                { label: 'Charity',   value: `${form.charityPercent}% of subscription` },
                { label: 'Draws',     value: 'Every monthly draw, automatically' },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-sm text-brand-muted">{row.label}</span>
                  <span className="text-sm text-brand-cream">{row.value}</span>
                </div>
              ))}
            </div>

            <Button onClick={handleCheckout} loading={loading} size="lg" className="w-full">
              Pay with Stripe
            </Button>
            <p className="text-center text-xs text-brand-muted mt-4">
              Secured by Stripe · Cancel anytime
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
