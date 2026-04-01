// src/app/api/admin/charities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

const UpdateSchema = z.object({
  name:        z.string().min(2).max(120).optional(),
  description: z.string().min(10).optional(),
  imageUrl:    z.string().url().optional().or(z.literal('')),
  websiteUrl:  z.string().url().optional().or(z.literal('')),
  featured:    z.boolean().optional(),
  active:      z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = UpdateSchema.parse(body);
    const charity = await db.charity.update({ where: { id: params.id }, data });
    return NextResponse.json({ charity });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    // Soft delete — set active false
    await db.charity.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
