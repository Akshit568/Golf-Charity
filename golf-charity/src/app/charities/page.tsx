// src/app/charities/page.tsx
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import { Card } from '@/components/ui';
import { Heart, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await getSession();
  const search  = searchParams.search ?? '';

  const charities = await db.charity.findMany({
    where: {
      active: true,
      ...(search ? {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      events: {
        where:   { eventDate: { gte: new Date() } },
        orderBy: { eventDate: 'asc' },
        take: 2,
      },
      _count: { select: { selections: true } },
    },
    orderBy: [{ featured: 'desc' }, { name: 'asc' }],
  });

  return (
    <div className="min-h-screen bg-brand-dark bg-grid">
      <Navbar session={session} />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-mono text-brand-gold uppercase tracking-widest mb-3">Our Causes</p>
          <h1 className="font-display text-5xl md:text-6xl font-light text-brand-cream mb-4">
            The charities<br />you're supporting
          </h1>
          <p className="text-brand-muted max-w-xl">
            Every member chooses a cause. Every subscription sends a donation. Browse and discover who your rounds are supporting.
          </p>
        </div>

        {/* Search */}
        <div className="mb-10">
          <form method="GET" className="max-w-md">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search charities..."
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-brand-cream placeholder:text-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold/40 transition-all"
            />
          </form>
        </div>

        {/* Charities grid */}
        {charities.length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-brand-muted mx-auto mb-4" />
            <p className="text-brand-muted">No charities found{search ? ` for "${search}"` : ''}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charities.map(c => (
            <Card key={c.id} hover className="overflow-hidden group flex flex-col">
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand-green/40 to-brand-dark">
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="w-10 h-10 text-brand-sage opacity-50" />
                  </div>
                )}
                {c.featured && (
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-brand-gold text-brand-dark text-xs font-mono font-bold">
                    FEATURED
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-display text-xl text-brand-cream leading-tight">{c.name}</h2>
                  {c.websiteUrl && (
                    <a
                      href={c.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-muted hover:text-brand-gold transition-colors flex-shrink-0 mt-0.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <p className="text-sm text-brand-muted leading-relaxed flex-1 mb-4">
                  {c.description}
                </p>

                {/* Upcoming events */}
                {c.events.length > 0 && (
                  <div className="border-t border-white/8 pt-4 space-y-2">
                    <p className="text-xs font-mono text-brand-muted uppercase tracking-wider">Upcoming</p>
                    {c.events.map(ev => (
                      <div key={ev.id} className="flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 text-brand-gold mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-brand-cream">{ev.title}</div>
                          <div className="text-xs text-brand-muted">
                            {new Date(ev.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {ev.location ? ` · ${ev.location}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-white/5">
                  <span className="text-xs font-mono text-brand-muted/60">
                    {c._count.selections} member{c._count.selections !== 1 ? 's' : ''} supporting
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-brand-muted mb-6">Ready to make every round count?</p>
          <Link href="/subscribe">
            <span className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-gold text-brand-dark font-medium hover:bg-amber-400 transition-colors">
              Choose your charity &amp; subscribe
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
