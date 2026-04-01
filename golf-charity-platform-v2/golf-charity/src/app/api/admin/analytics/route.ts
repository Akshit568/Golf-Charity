// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      activeSubscribers,
      monthlyCount,
      yearlyCount,
      totalPrizePool,
      charityContributions,
      drawStats,
      recentWinners,
    ] = await Promise.all([
      db.user.count(),
      db.subscription.count({ where: { status: 'ACTIVE' } }),
      db.subscription.count({ where: { status: 'ACTIVE', plan: 'MONTHLY' } }),
      db.subscription.count({ where: { status: 'ACTIVE', plan: 'YEARLY' } }),
      db.subscription.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { prizePoolContribution: true },
      }),
      db.subscription.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { charityContribution: true },
      }),
      db.draw.findMany({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
        include: {
          _count: { select: { entries: true, winners: true } },
        },
      }),
      db.winnerRecord.findMany({
        where: { paymentStatus: 'PENDING' },
        include: {
          user: { select: { name: true, email: true } },
          draw: { select: { month: true, year: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeSubscribers,
        monthly: monthlyCount,
        yearly: yearlyCount,
      },
      finance: {
        monthlyPrizePool: totalPrizePool._sum.prizePoolContribution ?? 0,
        monthlyCharity:   charityContributions._sum.charityContribution ?? 0,
      },
      draws: drawStats,
      pendingPayouts: recentWinners,
    });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
