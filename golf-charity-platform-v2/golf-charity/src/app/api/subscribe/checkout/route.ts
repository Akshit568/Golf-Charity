// src/app/api/subscribe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { db } from '@/lib/db';

const CheckoutSchema = z.object({
  plan:           z.enum(['MONTHLY', 'YEARLY']),
  charityId:      z.string().cuid(),
  charityPercent: z.number().min(10).max(100),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = CheckoutSchema.parse(body);

    // Check they don't already have an active subscription
    const existing = await db.subscription.findUnique({
      where: { userId: session.id },
    });
    if (existing?.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
    }

    const checkoutSession = await createCheckoutSession({
      userId:         session.id,
      email:          session.email,
      plan:           data.plan,
      charityId:      data.charityId,
      charityPercent: data.charityPercent,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
