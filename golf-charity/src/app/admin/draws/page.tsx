// src/app/admin/draws/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import { Card, Badge } from '@/components/ui';
import DrawControls from './DrawControls';

export default async function AdminDrawsPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const draws = await db.draw.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: {
      _count: { select: { entries: true, winners: true } },
    },
  });

  const activeSubscribers = await db.subscription.count({ where: { status: 'ACTIVE' } });

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now    = new Date();

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar session={session} />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <a href="/admin" className="text-xs text-brand-muted hover:text-brand-cream transition-colors mb-4 block">← Back to Admin</a>
          <h1 className="font-display text-4xl font-light text-brand-cream">Draw Management</h1>
          <p className="text-brand-muted mt-1">{activeSubscribers} active subscribers · {draws.length} draws total</p>
        </div>

        <DrawControls currentMonth={now.getMonth() + 1} currentYear={now.getFullYear()} />

        <div className="mt-10 space-y-4">
          {draws.map(draw => (
            <Card key={draw.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl text-brand-cream mb-1">
                    {MONTHS[draw.month - 1]} {draw.year}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={draw.status === 'PUBLISHED' ? 'green' : draw.status === 'SIMULATED' ? 'gold' : 'muted'}>
                      {draw.status}
                    </Badge>
                    <Badge variant="muted">{draw.drawType}</Badge>
                    {draw.jackpotRolledOver && <Badge variant="gold">Jackpot Rolled Over</Badge>}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-brand-gold font-mono text-lg">£{draw.totalPool.toFixed(2)}</div>
                  <div className="text-brand-muted text-xs">Prize pool</div>
                </div>
              </div>

              {draw.drawnNumbers.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-mono text-brand-muted uppercase tracking-wider mb-2">Drawn Numbers</p>
                  <div className="flex gap-2">
                    {draw.drawnNumbers.map(n => (
                      <span key={n} className="w-9 h-9 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center text-sm font-mono font-bold">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-6 text-sm text-brand-muted">
                <span>{draw._count.entries} entries</span>
                <span>{draw._count.winners} winners</span>
                <span>Pool: £{draw.fiveMatchPool.toFixed(0)} / £{draw.fourMatchPool.toFixed(0)} / £{draw.threeMatchPool.toFixed(0)}</span>
              </div>

              {draw.status !== 'PUBLISHED' && (
                <DrawControls drawId={draw.id} drawStatus={draw.status} />
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
