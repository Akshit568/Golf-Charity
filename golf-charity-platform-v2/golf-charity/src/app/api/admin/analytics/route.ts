// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { SUBSCRIPTION_FEES } from '@/lib/draw-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const [
      totalUsers,
      activeSubscribers,
      monthlyCount,
      yearlyCount,
      activeSubscriptions,
      charityContributions,
      drawStats,
      recentWinners,
    ] = await Promise.all([
      db.user.count(),
      db.subscription.count({ where: { status: 'ACTIVE' } }),
      db.subscription.count({ where: { status: 'ACTIVE', plan: 'MONTHLY' } }),
      db.subscription.count({ where: { status: 'ACTIVE', plan: 'YEARLY' } }),
      db.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { plan: true, charityContribution: true },
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

    const monthlyPrizePool = activeSubscriptions.reduce((sum, sub) => {
      const fee = sub.plan === 'YEARLY'
        ? SUBSCRIPTION_FEES.YEARLY
        : SUBSCRIPTION_FEES.MONTHLY;
      return sum + (fee - sub.charityContribution);
    }, 0);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeSubscribers,
        monthly: monthlyCount,
        yearly: yearlyCount,
      },
      finance: {
        monthlyPrizePool,
        monthlyCharity: charityContributions._sum.charityContribution ?? 0,
      },
      draws: drawStats,
      pendingPayouts: recentWinners,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
