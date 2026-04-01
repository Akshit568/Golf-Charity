// src/app/page.tsx
import Link from 'next/link';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import { Button, Card } from '@/components/ui';
import { Heart, Trophy, Target, ArrowRight, Star } from 'lucide-react';

export default async function HomePage() {
  const session = await getSession();

  // Featured charities
  const charities = await db.charity.findMany({
    where: { active: true, featured: true },
    take: 3,
    include: { _count: { select: { selections: true } } },
  }).catch(() => []);

  // Latest draw result
  const latestDraw = await db.draw.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: { _count: { select: { winners: true } } },
  }).catch(() => null);

  const activeSubscribers = await db.subscription.count({
    where: { status: 'ACTIVE' },
  }).catch(() => 0);

  return (
    <div className="min-h-screen bg-brand-dark bg-grid">
      <Navbar session={session} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Ambient gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-green/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 text-brand-gold text-xs font-mono tracking-widest uppercase mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
            {activeSubscribers > 0 ? `${activeSubscribers.toLocaleString()} members giving back` : 'Golf with purpose'}
          </div>

          {/* Headline */}
          <h1 className="font-display text-6xl md:text-8xl font-light leading-[0.9] tracking-tight text-balance mb-6 animate-fade-up">
            Every round
            <br />
            <em className="not-italic text-gold-gradient">matters.</em>
          </h1>

          <p className="max-w-xl mx-auto text-brand-muted text-lg md:text-xl font-light leading-relaxed mb-12 animate-fade-up animate-delay-100">
            Subscribe. Enter your Stableford scores. Win monthly prizes.
            And give a piece of every subscription to a cause you believe in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up animate-delay-200">
            <Link href="/subscribe">
              <Button size="lg" className="min-w-[200px]">
                Start Playing <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button variant="ghost" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative mt-20 max-w-3xl mx-auto w-full grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/8">
          {[
            { label: 'Monthly Draw',   value: 'Win Cash',    sub: 'Prize pool grows with members' },
            { label: 'Charity Impact', value: '≥10%',        sub: 'Of every subscription donated' },
            { label: 'Draw Format',    value: '5 Numbers',   sub: 'Matched against your scores' },
          ].map((s) => (
            <div key={s.label} className="bg-brand-dark/60 p-6 text-center">
              <div className="font-display text-2xl md:text-3xl font-light text-brand-gold mb-1">{s.value}</div>
              <div className="text-xs font-mono uppercase tracking-wider text-brand-muted mb-1">{s.label}</div>
              <div className="text-xs text-brand-muted/60 hidden md:block">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-xs font-mono text-brand-gold uppercase tracking-widest mb-4">The System</p>
            <h2 className="font-display text-5xl md:text-6xl font-light text-brand-cream">
              Simple as a bogey-free round
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: Target,
                title: 'Subscribe',
                desc: 'Choose monthly or yearly. Pick your charity. You\'re in.'
              },
              {
                step: '02',
                icon: Star,
                title: 'Score',
                desc: 'Log your last 5 Stableford scores after each round. Simple.'
              },
              {
                step: '03',
                icon: Trophy,
                title: 'Draw',
                desc: '5 numbers drawn monthly. Match 3, 4, or all 5 to win your share of the pool.'
              },
              {
                step: '04',
                icon: Heart,
                title: 'Give',
                desc: 'Your charity contribution lands automatically with every payment.'
              },
            ].map((item) => (
              <Card key={item.step} hover className="p-8 relative overflow-hidden group">
                <div className="absolute top-4 right-4 font-mono text-5xl font-bold text-white/3 group-hover:text-white/5 transition-colors select-none">
                  {item.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-green/40 flex items-center justify-center mb-6">
                  <item.icon className="w-5 h-5 text-brand-gold" />
                </div>
                <h3 className="font-display text-2xl font-light text-brand-cream mb-3">{item.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE BREAKDOWN ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs font-mono text-brand-gold uppercase tracking-widest mb-4">Prize Pool</p>
            <h2 className="font-display text-4xl md:text-5xl font-light">
              Three ways to win each month
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { match: '5 Numbers',  share: '40%', label: 'JACKPOT',   note: 'Rolls over if unclaimed',       color: 'border-amber-500/40 bg-amber-500/5' },
              { match: '4 Numbers',  share: '35%', label: 'MAJOR',     note: 'Split among all 4-match winners', color: 'border-brand-sage/40 bg-brand-green/5' },
              { match: '3 Numbers',  share: '25%', label: 'MINOR',     note: 'Split among all 3-match winners', color: 'border-white/10 bg-white/2' },
            ].map((tier) => (
              <div key={tier.match} className={`flex items-center justify-between p-6 rounded-2xl border ${tier.color}`}>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-brand-muted uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">{tier.label}</span>
                  <span className="font-display text-xl text-brand-cream">Match {tier.match}</span>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl text-brand-gold">{tier.share}</div>
                  <div className="text-xs text-brand-muted">{tier.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED CHARITIES ───────────────────────────────────────────── */}
      {charities.length > 0 && (
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-mono text-brand-gold uppercase tracking-widest mb-4">Featured Causes</p>
                <h2 className="font-display text-4xl md:text-5xl font-light">
                  Your subscription,<br />their future.
                </h2>
              </div>
              <Link href="/charities" className="hidden md:flex items-center gap-2 text-sm text-brand-muted hover:text-brand-cream transition-colors link-underline">
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {charities.map((charity) => (
                <Card key={charity.id} hover className="overflow-hidden group">
                  {charity.imageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={charity.imageUrl}
                        alt={charity.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-brand-green/40 to-brand-dark flex items-center justify-center">
                      <Heart className="w-12 h-12 text-brand-sage" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-xl text-brand-cream">{charity.name}</h3>
                      {charity.featured && (
                        <span className="text-xs font-mono text-brand-gold border border-brand-gold/30 px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-brand-muted leading-relaxed line-clamp-3">
                      {charity.description}
                    </p>
                    {charity._count.selections > 0 && (
                      <p className="mt-4 text-xs font-mono text-brand-muted/60">
                        {charity._count.selections} member{charity._count.selections !== 1 ? 's' : ''} supporting
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl border border-brand-gold/20 bg-brand-gold/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 to-transparent" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-6xl font-light mb-6 text-brand-cream">
                Ready to play<br />with purpose?
              </h2>
              <p className="text-brand-muted mb-10 max-w-md mx-auto">
                From £9.99/month. Cancel anytime. Every round you play could win you cash — and will always support a charity.
              </p>
              <Link href="/subscribe">
                <Button size="lg">
                  Subscribe Now — from £9.99 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-gold flex items-center justify-center">
              <span className="text-brand-dark text-[10px] font-bold">F</span>
            </div>
            <span className="font-display text-sm text-brand-muted">Fairway &amp; Good</span>
          </div>
          <div className="flex gap-6 text-xs text-brand-muted">
            <Link href="/charities" className="hover:text-brand-cream transition-colors">Charities</Link>
            <Link href="/#how-it-works" className="hover:text-brand-cream transition-colors">How It Works</Link>
            <Link href="/subscribe" className="hover:text-brand-cream transition-colors">Subscribe</Link>
          </div>
          <p className="text-xs text-brand-muted/40">© 2026 Fairway & Good. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
