// src/app/admin/winners/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import { Card, Badge } from '@/components/ui';
import WinnerActions from './WinnerActions';

export default async function AdminWinnersPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const winners = await db.winnerRecord.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      draw: { select: { month: true, year: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const pending  = winners.filter(w => w.paymentStatus === 'PENDING');
  const verified = winners.filter(w => w.paymentStatus !== 'PENDING');

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar session={session} />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <a href="/admin" className="text-xs text-brand-muted hover:text-brand-cream transition-colors mb-4 block">← Back to Admin</a>
          <h1 className="font-display text-4xl font-light text-brand-cream">Winners</h1>
          <p className="text-brand-muted mt-1">
            {pending.length} pending · {verified.length} processed
          </p>
        </div>

        {pending.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-2xl font-light text-amber-300 mb-4">
              Pending Verification
            </h2>
            <div className="space-y-4">
              {pending.map(w => (
                <Card key={w.id} className="p-6 border-amber-500/20">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-brand-cream">{w.user.name}</span>
                        <Badge variant="gold">{w.matchType.replace('_NUMBER', ' match')}</Badge>
                      </div>
                      <div className="text-sm text-brand-muted">{w.user.email}</div>
                      <div className="text-xs text-brand-muted mt-1">
                        {MONTHS[w.draw.month - 1]} {w.draw.year} draw
                      </div>
                      {w.proofImageUrl && (
                        <a
                          href={w.proofImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-gold hover:text-amber-300 underline mt-1 inline-block"
                        >
                          View proof →
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="font-display text-2xl text-brand-gold">
                        £{w.prizeAmount.toFixed(2)}
                      </div>
                      <WinnerActions winnerId={w.id} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {verified.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-light text-brand-cream mb-4">History</h2>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['Winner', 'Draw', 'Match', 'Prize', 'Status', 'Paid'].map(h => (
                        <th key={h} className="text-left p-4 text-xs font-mono text-brand-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {verified.map(w => (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <div className="text-brand-cream">{w.user.name}</div>
                          <div className="text-xs text-brand-muted">{w.user.email}</div>
                        </td>
                        <td className="p-4 text-brand-muted">{MONTHS[w.draw.month - 1]} {w.draw.year}</td>
                        <td className="p-4 text-brand-muted">{w.matchType.replace('_', ' ')}</td>
                        <td className="p-4 font-mono text-brand-gold">£{w.prizeAmount.toFixed(2)}</td>
                        <td className="p-4">
                          <Badge variant={w.paymentStatus === 'PAID' ? 'green' : 'red'}>
                            {w.paymentStatus}
                          </Badge>
                        </td>
                        <td className="p-4 text-brand-muted text-xs">
                          {w.paidAt ? new Date(w.paidAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {winners.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-brand-muted">No winners yet — run and publish a draw first.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
