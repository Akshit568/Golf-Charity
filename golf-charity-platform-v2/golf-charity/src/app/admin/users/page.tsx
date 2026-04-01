// src/app/admin/users/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import { Card, Badge } from '@/components/ui';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const users = await db.user.findMany({
    include: {
      subscription: true,
      charitySelection: { include: { charity: { select: { name: true } } } },
      scores:       { orderBy: { datePlayed: 'desc' }, take: 5 },
      _count:       { select: { winnerRecords: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar session={session} />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <a href="/admin" className="text-xs text-brand-muted hover:text-brand-cream transition-colors mb-4 block">← Back to Admin</a>
          <h1 className="font-display text-4xl font-light text-brand-cream">Users</h1>
          <p className="text-brand-muted mt-1">{users.length} total registered users</p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['User', 'Subscription', 'Scores', 'Charity', 'Wins', 'Joined'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-mono text-brand-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] group">
                    <td className="p-4">
                      <div className="text-brand-cream font-medium">{u.name}</div>
                      <div className="text-xs text-brand-muted">{u.email}</div>
                    </td>
                    <td className="p-4">
                      {u.subscription ? (
                        <div>
                          <Badge variant={u.subscription.status === 'ACTIVE' ? 'green' : u.subscription.status === 'LAPSED' ? 'red' : 'muted'}>
                            {u.subscription.status}
                          </Badge>
                          <div className="text-xs text-brand-muted mt-1">{u.subscription.plan}</div>
                        </div>
                      ) : (
                        <Badge variant="muted">None</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {u.scores.map(s => (
                          <span key={s.id} className="w-6 h-6 rounded bg-brand-green/30 text-green-200 text-xs flex items-center justify-center font-mono">
                            {s.score}
                          </span>
                        ))}
                        {u.scores.length === 0 && <span className="text-xs text-brand-muted">No scores</span>}
                      </div>
                    </td>
                    <td className="p-4 text-brand-muted text-xs">
                      {u.charitySelection?.charity.name ?? '—'}
                      {u.charitySelection && (
                        <span className="ml-1 text-brand-gold">({u.charitySelection.contributionPercent}%)</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-brand-muted">
                      {u._count.winnerRecords}
                    </td>
                    <td className="p-4 text-brand-muted text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
