// src/app/admin/charities/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import { Card, Badge } from '@/components/ui';
import CharityManager from './CharityManager';

export default async function AdminCharitiesPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const charities = await db.charity.findMany({
    orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { selections: true } } },
  });

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar session={session} />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <a href="/admin" className="text-xs text-brand-muted hover:text-brand-cream transition-colors mb-4 block">← Back to Admin</a>
          <h1 className="font-display text-4xl font-light text-brand-cream">Charity Directory</h1>
          <p className="text-brand-muted mt-1">{charities.length} charities listed</p>
        </div>

        <CharityManager initialCharities={charities} />
      </main>
    </div>
  );
}
