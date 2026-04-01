// src/app/api/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getUserScores, addScore } from '@/lib/scores';

const AddScoreSchema = z.object({
  score:      z.number().int().min(1).max(45),
  datePlayed: z.string().datetime(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const scores = await getUserScores(session.id);
  return NextResponse.json({ scores });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = AddScoreSchema.parse(body);

    const score = await addScore(session.id, data.score, new Date(data.datePlayed));
    return NextResponse.json({ score }, { status: 201 });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
