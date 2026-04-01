// src/app/api/admin/charities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

const CharitySchema = z.object({
  name:        z.string().min(2).max(120),
  description: z.string().min(10),
  imageUrl:    z.string().url().optional().or(z.literal('')),
  websiteUrl:  z.string().url().optional().or(z.literal('')),
  featured:    z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = CharitySchema.parse(body);

    const charity = await db.charity.create({
      data: { ...data, active: true },
    });
    return NextResponse.json({ charity }, { status: 201 });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
