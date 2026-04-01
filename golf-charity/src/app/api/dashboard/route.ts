// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user, scores, draws, winnings] = await Promise.all([
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
      },
    }),
    db.winnerRecord.findMany({
      where: { userId: session.id },
      include: { draw: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ user, scores, draws, winnings });
}
