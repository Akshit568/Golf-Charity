// src/app/api/scores/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { updateScore, deleteScore } from '@/lib/scores';

const UpdateScoreSchema = z.object({
  score:      z.number().int().min(1).max(45),
  datePlayed: z.string().datetime(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = UpdateScoreSchema.parse(body);
    const score = await updateScore(params.id, session.id, data.score, new Date(data.datePlayed));
    return NextResponse.json({ score });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await deleteScore(params.id, session.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
