// src/app/api/admin/draws/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { executeDraw, generateRandomDraw, generateAlgorithmicDraw, countMatches, getMatchType } from '@/lib/draw-engine';

// POST action: simulate | publish
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { action } = await req.json();

    const draw = await db.draw.findUnique({ where: { id: params.id } });
    if (!draw) return NextResponse.json({ error: 'Draw not found' }, { status: 404 });

    if (action === 'simulate') {
      // Generate numbers but don't save winners — just return preview
      const numbers =
        draw.drawType === 'ALGORITHMIC'
          ? await generateAlgorithmicDraw()
          : generateRandomDraw();

      const entries = await db.drawEntry.findMany({
        where: { drawId: params.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      const preview = entries.map(e => {
        const matches  = countMatches(e.scoreSnapshot, numbers);
        const matchType = getMatchType(matches);
        return {
          userId:    e.userId,
          name:      e.user.name,
          email:     e.user.email,
          scores:    e.scoreSnapshot,
          matches,
          matchType,
        };
      }).filter(e => e.matchType !== null);

      await db.draw.update({
        where: { id: params.id },
        data: { status: 'SIMULATED', drawnNumbers: numbers },
      });

      return NextResponse.json({ numbers, preview });
    }

    if (action === 'publish') {
      if (draw.status === 'DRAFT') {
        return NextResponse.json({ error: 'Simulate first before publishing' }, { status: 400 });
      }
      const result = await executeDraw(params.id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Forbidden' }, { status: 403 });
  }
}
