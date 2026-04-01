// src/app/api/charities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get('search') ?? '';
  const featured = searchParams.get('featured') === 'true';

  const charities = await db.charity.findMany({
    where: {
      active: true,
      ...(featured ? { featured: true } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      events: {
        where: { eventDate: { gte: new Date() } },
        orderBy: { eventDate: 'asc' },
        take: 3,
      },
      _count: { select: { selections: true } },
    },
    orderBy: [{ featured: 'desc' }, { name: 'asc' }],
  });

  return NextResponse.json({ charities });
}
