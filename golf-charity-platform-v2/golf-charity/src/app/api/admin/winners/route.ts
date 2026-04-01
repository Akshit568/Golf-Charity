// src/app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();
    const winners = await db.winnerRecord.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        draw: { select: { month: true, year: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ winners });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

const UpdateWinnerSchema = z.object({
  winnerId:      z.string().cuid(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REJECTED']),
  adminNotes:    z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = UpdateWinnerSchema.parse(body);

    const winner = await db.winnerRecord.update({
      where: { id: data.winnerId },
      data: {
        paymentStatus: data.paymentStatus,
        adminNotes:    data.adminNotes,
        verifiedAt:    data.paymentStatus !== 'PENDING' ? new Date() : undefined,
        paidAt:        data.paymentStatus === 'PAID' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ winner });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
