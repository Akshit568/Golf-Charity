// src/lib/draw-engine.ts
// Core draw engine: random + algorithmic modes, prize calculations

import { db } from './db';
import { MatchType } from '@prisma/client';

// ── Prize Pool Distribution ───────────────────────────────────────────────────

export const PRIZE_DISTRIBUTION = {
  FIVE_NUMBER: 0.40,   // 40% — jackpot (rolls over)
  FOUR_NUMBER: 0.35,   // 35%
  THREE_NUMBER: 0.25,  // 25%
} as const;

export const SUBSCRIPTION_FEES = {
  MONTHLY: 9.99,
  YEARLY: 99.00 / 12, // monthly equivalent
};

// ── Number Generation ────────────────────────────────────────────────────────

/**
 * Random draw: 5 unique numbers from 1-45
 */
export function generateRandomDraw(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const drawn: number[] = [];
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return drawn.sort((a, b) => a - b);
}

/**
 * Algorithmic draw: weighted by least frequent user scores
 * Increases jackpot probability for engaged players
 */
export async function generateAlgorithmicDraw(drawId?: string): Promise<number[]> {
  const scores = await db.golfScore.findMany({
    where: {
      user: {
        subscription: { status: 'ACTIVE' },
      },
    },
    select: { score: true },
  });

  const frequency = new Map<number, number>();
  for (let i = 1; i <= 45; i++) frequency.set(i, 0);
  for (const { score } of scores) {
    frequency.set(score, (frequency.get(score) ?? 0) + 1);
  }

  const maxFreq = Math.max(...frequency.values()) + 1;
  const weights = Array.from({ length: 45 }, (_, i) => ({
    number: i + 1,
    weight: maxFreq - (frequency.get(i + 1) ?? 0),
  }));

  const drawn: number[] = [];
  const available = [...weights];

  for (let i = 0; i < 5; i++) {
    const totalWeight = available.reduce((sum, w) => sum + w.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let j = 0; j < available.length; j++) {
      rand -= available[j].weight;
      if (rand <= 0) {
        drawn.push(available[j].number);
        available.splice(j, 1);
        break;
      }
    }
  }

  return drawn.sort((a, b) => a - b);
}

// ── Match Detection ───────────────────────────────────────────────────────────

export function countMatches(userScores: number[], drawnNumbers: number[]): number {
  const drawnSet = new Set(drawnNumbers);
  return userScores.filter(s => drawnSet.has(s)).length;
}

export function getMatchType(matches: number): MatchType | null {
  if (matches === 5) return 'FIVE_NUMBER';
  if (matches === 4) return 'FOUR_NUMBER';
  if (matches === 3) return 'THREE_NUMBER';
  return null;
}

// ── Prize Calculation ─────────────────────────────────────────────────────────

export async function calculatePrizePool(month: number, year: number) {
  const activeCount = await db.subscription.count({
    where: { status: 'ACTIVE' },
  });

  const subscriptions = await db.subscription.findMany({
    where: { status: 'ACTIVE' },
    select: { plan: true, charityContribution: true },
  });

  // Total prize contributions (fee minus charity contribution)
  const totalPrizePool = subscriptions.reduce((sum, sub) => {
    const fee = sub.plan === 'YEARLY'
      ? SUBSCRIPTION_FEES.YEARLY
      : SUBSCRIPTION_FEES.MONTHLY;
    return sum + (fee - sub.charityContribution);
  }, 0);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevDraw = await db.draw.findFirst({
    where: { month: prevMonth, year: prevYear, jackpotRolledOver: true },
  });

  const rolloverAmount = prevDraw?.rolledOverAmount ?? 0;

  return {
    total: totalPrizePool + rolloverAmount,
    fiveMatch: totalPrizePool * PRIZE_DISTRIBUTION.FIVE_NUMBER + rolloverAmount,
    fourMatch: totalPrizePool * PRIZE_DISTRIBUTION.FOUR_NUMBER,
    threeMatch: totalPrizePool * PRIZE_DISTRIBUTION.THREE_NUMBER,
    rolloverAmount,
    activeSubscribers: activeCount,
  };
}

// ── Full Draw Execution ───────────────────────────────────────────────────────

export async function executeDraw(drawId: string): Promise<{
  drawnNumbers: number[];
  winners: { userId: string; matchType: MatchType; prize: number }[];
}> {
  const draw = await db.draw.findUnique({
    where: { id: drawId },
    include: { entries: true },
  });
  if (!draw) throw new Error('Draw not found');

  const drawnNumbers =
    draw.drawType === 'ALGORITHMIC'
      ? await generateAlgorithmicDraw(drawId)
      : generateRandomDraw();

  const winnerGroups: Record<string, string[]> = {
    FIVE_NUMBER: [],
    FOUR_NUMBER: [],
    THREE_NUMBER: [],
  };

  for (const entry of draw.entries) {
    const matches = countMatches(entry.scoreSnapshot, drawnNumbers);
    const matchType = getMatchType(matches);
    if (matchType) {
      winnerGroups[matchType].push(entry.userId);
    }
  }

  const prizes: { userId: string; matchType: MatchType; prize: number }[] = [];

  for (const [matchType, userIds] of Object.entries(winnerGroups)) {
    if (userIds.length === 0) continue;
    const poolKey = matchType as MatchType;
    const pool =
      poolKey === 'FIVE_NUMBER' ? draw.fiveMatchPool
      : poolKey === 'FOUR_NUMBER' ? draw.fourMatchPool
      : draw.threeMatchPool;

    const prizePerWinner = pool / userIds.length;
    for (const userId of userIds) {
      prizes.push({ userId, matchType: poolKey, prize: prizePerWinner });
    }
  }

  const hasJackpotWinner = winnerGroups.FIVE_NUMBER.length > 0;

  await db.$transaction([
    db.draw.update({
      where: { id: drawId },
      data: {
        drawnNumbers,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        jackpotRolledOver: !hasJackpotWinner,
        rolledOverAmount: !hasJackpotWinner ? draw.fiveMatchPool : 0,
      },
    }),
    ...prizes.map(p =>
      db.winnerRecord.create({
        data: {
          drawId,
          userId: p.userId,
          matchType: p.matchType,
          prizeAmount: p.prize,
          paymentStatus: 'PENDING',
        },
      })
    ),
  ]);

  return { drawnNumbers, winners: prizes };
}
