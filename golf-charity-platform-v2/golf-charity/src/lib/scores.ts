// src/lib/scores.ts
// Business logic: only latest 5 scores retained (rolling window)

import { db } from './db';

export const SCORE_MIN = 1;
export const SCORE_MAX = 45;
export const MAX_SCORES = 5;

export async function getUserScores(userId: string) {
  return db.golfScore.findMany({
    where: { userId },
    orderBy: { datePlayed: 'desc' },
    take: MAX_SCORES,
  });
}

export async function addScore(userId: string, score: number, datePlayed: Date) {
  if (score < SCORE_MIN || score > SCORE_MAX) {
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  // Count current scores
  const count = await db.golfScore.count({ where: { userId } });

  // If already at 5, delete the oldest one first
  if (count >= MAX_SCORES) {
    const oldest = await db.golfScore.findFirst({
      where: { userId },
      orderBy: { datePlayed: 'asc' },
    });
    if (oldest) {
      await db.golfScore.delete({ where: { id: oldest.id } });
    }
  }

  return db.golfScore.create({
    data: { userId, score, datePlayed },
  });
}

export async function updateScore(
  scoreId: string,
  userId: string,
  score: number,
  datePlayed: Date
) {
  if (score < SCORE_MIN || score > SCORE_MAX) {
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  // Verify ownership
  const existing = await db.golfScore.findFirst({
    where: { id: scoreId, userId },
  });
  if (!existing) throw new Error('Score not found');

  return db.golfScore.update({
    where: { id: scoreId },
    data: { score, datePlayed },
  });
}

export async function deleteScore(scoreId: string, userId: string) {
  const existing = await db.golfScore.findFirst({
    where: { id: scoreId, userId },
  });
  if (!existing) throw new Error('Score not found');
  return db.golfScore.delete({ where: { id: scoreId } });
}
