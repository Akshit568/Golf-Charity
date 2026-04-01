// src/app/api/admin/draws/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  calculatePrizePool,
  generateRandomDraw,
  generateAlgorithmicDraw,
  executeDraw,
} from '@/lib/draw-engine';

const CreateDrawSchema = z.object({
  month:    z.number().int().min(1).max(12),
  year:     z.number().int().min(2024).max(2100),
  drawType: z.enum(['RANDOM', 'ALGORITHMIC']).default('RANDOM'),
});

// GET — list all draws
export async function GET() {
  try {
    await requireAdmin();
    const draws = await db.draw.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        _count: { select: { entries: true, winners: true } },
      },
    });
    return NextResponse.json({ draws });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

// POST — create a new draw
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = CreateDrawSchema.parse(body);

    const existing = await db.draw.findUnique({
      where: { month_year: { month: data.month, year: data.year } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Draw for this month already exists' }, { status: 409 });
    }

    const pool = await calculatePrizePool(data.month, data.year);

    // Snapshot all active subscribers' scores as draw entries
    const activeUsers = await db.user.findMany({
      where: { subscription: { status: 'ACTIVE' } },
      include: {
        scores: {
          orderBy: { datePlayed: 'desc' },
          take: 5,
        },
      },
    });

    const draw = await db.draw.create({
      data: {
        month:          data.month,
        year:           data.year,
        drawType:       data.drawType,
        status:         'DRAFT',
        drawnNumbers:   [],
        totalPool:      pool.total,
        fiveMatchPool:  pool.fiveMatch,
        fourMatchPool:  pool.fourMatch,
        threeMatchPool: pool.threeMatch,
        rolledOverAmount: pool.rolloverAmount,
        entries: {
          create: activeUsers
            .filter(u => u.scores.length >= 3) // need at least 3 scores to enter
            .map(u => ({
              userId:        u.id,
              scoreSnapshot: u.scores.map(s => s.score),
            })),
        },
      },
    });

    return NextResponse.json({ draw }, { status: 201 });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
