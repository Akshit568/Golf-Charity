// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import { Card, Badge, StatCard } from '@/components/ui';
import ScoreManager from './ScoreManager';
import { Trophy, Heart, Calendar, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'ADMIN') redirect('/admin');

  const [user, scores, recentDraws, winnings] = await Promise.all([
    db.user.findUnique({
      where: { id: session.id },
      include: {
        subscription: true,
        charitySelection: { include: { charity: true } },
      },
    }),
    db.golfScore.findMany({
      where: { userId: session.id },
      orderBy: { datePlayed: 'desc' },
      take: 5,
    }),
    db.draw.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 6,
      include: {
        entries: { where: { userId: session.id } },
        winners: { where: { userId: session.id } },
      },
    }),
    db.winnerRecord.findMany({
      where: { userId: session.id },
      include: { draw: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!user) redirect('/login');

  const totalWon = winnings.reduce((sum, w) => sum + w.prizeAmount, 0);
  const pendingPayout = winnings.filter(w => w.paymentStatus === 'PENDING').reduce((sum, w) => sum + w.prizeAmount, 0);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar session={session} />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-mono text-brand-gold uppercase tracking-widest mb-2">Your Dashboard</p>
          <h1 className="font-display text-5xl font-light text-brand-cream">
            Hello, <em>{session.name.split(' ')[0]}</em>
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Subscription"
            value={user.subscription?.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            sub={user.subscription ? `${user.subscription.plan.toLowerCase()} · renews ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}` : 'Not subscribed'}
            icon={Calendar}
          />
          <StatCard
            label="My Charity"
            value={user.charitySelection?.charity.name ?? '—'}
            sub={user.charitySelection ? `${user.charitySelection.contributionPercent}% donated` : 'Not selected'}
            icon={Heart}
          />
          <StatCard
            label="Total Won"
            value={`£${totalWon.toFixed(2)}`}
            sub={pendingPayout > 0 ? `£${pendingPayout.toFixed(2)} pending` : 'All paid out'}
            icon={Trophy}
          />
          <StatCard
            label="Draws Entered"
            value={recentDraws.filter(d => d.entries.length > 0).length}
            sub={`of last ${recentDraws.length} draws`}
            icon={TrendingUp}
          />
        </div>

        {/* Subscription alert */}
        {!user.subscription || user.subscription.status !== 'ACTIVE' ? (
          <div className="mb-10 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 font-medium mb-1">You don't have an active subscription</p>
            <p className="text-sm text-brand-muted mb-4">Subscribe to enter monthly draws and support your chosen charity.</p>
            <a href="/subscribe" className="text-sm text-amber-300 hover:text-amber-200 underline">Subscribe now →</a>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Score manager */}
          <div>
            <h2 className="font-display text-2xl font-light text-brand-cream mb-5">Your Scores</h2>
            <ScoreManager initialScores={scores} />
          </div>

          {/* Recent draws */}
          <div>
            <h2 className="font-display text-2xl font-light text-brand-cream mb-5">Recent Draws</h2>
            <div className="space-y-3">
              {recentDraws.length === 0 && (
                <Card className="p-6 text-center">
                  <p className="text-brand-muted text-sm">No draws published yet</p>
                </Card>
              )}
              {recentDraws.map(draw => {
                const entered  = draw.entries.length > 0;
                const winner   = draw.winners[0];
                return (
                  <Card key={draw.id} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-display text-lg text-brand-cream">
                        {MONTHS[draw.month - 1]} {draw.year}
                      </span>
                      <div className="flex gap-2">
                        {winner ? (
                          <Badge variant="gold">
                            Winner · £{winner.prizeAmount.toFixed(2)}
                          </Badge>
                        ) : entered ? (
                          <Badge variant="muted">Entered</Badge>
                        ) : (
                          <Badge variant="red">Not Entered</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {draw.drawnNumbers.map(n => (
                        <span
                          key={n}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-medium ${
                            entered && draw.entries[0]?.scoreSnapshot.includes(n)
                              ? 'bg-brand-gold text-brand-dark'
                              : 'bg-white/5 text-brand-muted'
                          }`}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Winnings table */}
        {winnings.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-light text-brand-cream mb-5">Prize History</h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left p-4 text-xs font-mono text-brand-muted uppercase tracking-wider">Draw</th>
                      <th className="text-left p-4 text-xs font-mono text-brand-muted uppercase tracking-wider">Match</th>
                      <th className="text-left p-4 text-xs font-mono text-brand-muted uppercase tracking-wider">Prize</th>
                      <th className="text-left p-4 text-xs font-mono text-brand-muted uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winnings.map(w => (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 text-brand-cream">{MONTHS[w.draw.month - 1]} {w.draw.year}</td>
                        <td className="p-4 text-brand-muted">{w.matchType.replace('_', ' ')}</td>
                        <td className="p-4 text-brand-gold font-mono">£{w.prizeAmount.toFixed(2)}</td>
                        <td className="p-4">
                          <Badge variant={w.paymentStatus === 'PAID' ? 'green' : w.paymentStatus === 'REJECTED' ? 'red' : 'gold'}>
                            {w.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
