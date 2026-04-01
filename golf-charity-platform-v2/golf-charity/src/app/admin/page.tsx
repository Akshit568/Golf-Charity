// src/app/admin/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Card, StatCard, Badge } from '@/components/ui';
import { Users, Trophy, Heart, BarChart3, Settings, ChevronRight } from 'lucide-react';

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') redirect('/dashboard');

  const [
    totalUsers,
    activeSubscribers,
    pendingWinners,
    totalCharity,
    recentDraws,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: 'ACTIVE' } }),
    db.winnerRecord.count({ where: { paymentStatus: 'PENDING' } }),
    db.subscription.aggregate({ where: { status: 'ACTIVE' }, _sum: { charityContribution: true } }),
    db.draw.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 5,
      include: { _count: { select: { entries: true, winners: true } } },
    }),
  ]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const navItems = [
    { href: '/admin/users',     label: 'Users',     desc: 'Manage subscribers',    icon: Users },
    { href: '/admin/draws',     label: 'Draws',     desc: 'Run monthly draws',     icon: Trophy },
    { href: '/admin/charities', label: 'Charities', desc: 'Manage charity listing', icon: Heart },
    { href: '/admin/winners',   label: 'Winners',   desc: 'Verify & process payouts', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar session={session} />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono tracking-wider mb-4">
            <Settings className="w-3 h-3" /> ADMIN PANEL
          </div>
          <h1 className="font-display text-5xl font-light text-brand-cream">Control Centre</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total Users"    value={totalUsers}          icon={Users} />
          <StatCard label="Active Subs"    value={activeSubscribers}   icon={BarChart3} />
          <StatCard label="Pending Payouts" value={pendingWinners}      sub="Awaiting verification" icon={Trophy} />
          <StatCard
            label="Monthly Charity"
            value={`£${(totalCharity._sum.charityContribution ?? 0).toFixed(0)}`}
            sub="Contributed this cycle"
            icon={Heart}
          />
        </div>

        {/* Nav tiles */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}>
              <Card hover className="p-6 flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-green/40 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-brand-gold" />
                  </div>
                  <div>
                    <div className="font-medium text-brand-cream">{item.label}</div>
                    <div className="text-xs text-brand-muted">{item.desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-gold transition-colors" />
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent draws table */}
        <div>
          <h2 className="font-display text-2xl font-light text-brand-cream mb-5">Recent Draws</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Draw', 'Status', 'Entries', 'Winners', 'Action'].map(h => (
                      <th key={h} className="text-left p-4 text-xs font-mono text-brand-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentDraws.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-brand-muted text-sm">No draws yet</td>
                    </tr>
                  )}
                  {recentDraws.map(draw => (
                    <tr key={draw.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-4 font-display text-lg text-brand-cream">
                        {MONTHS[draw.month - 1]} {draw.year}
                      </td>
                      <td className="p-4">
                        <Badge variant={draw.status === 'PUBLISHED' ? 'green' : draw.status === 'SIMULATED' ? 'gold' : 'muted'}>
                          {draw.status}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-brand-muted">{draw._count.entries}</td>
                      <td className="p-4 font-mono text-brand-muted">{draw._count.winners}</td>
                      <td className="p-4">
                        <Link href="/admin/draws" className="text-xs text-brand-gold hover:text-amber-300 transition-colors">
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
