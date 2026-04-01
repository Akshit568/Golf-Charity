// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const payload = await req.arrayBuffer();
  const sig     = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = await constructWebhookEvent(Buffer.from(payload), sig);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    // ── Subscription Created ─────────────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession;
      const meta    = session.metadata!;

      const feeMonthly =
        meta.plan === 'MONTHLY' ? 9.99 : 99.00 / 12;

      const charityPercent    = parseFloat(meta.charityPercent) / 100;
      const charityContrib    = feeMonthly * charityPercent;
      const prizePoolContrib  = feeMonthly * (1 - charityPercent);

      await db.$transaction([
        db.subscription.upsert({
          where: { userId: meta.userId },
          create: {
            userId:               meta.userId,
            plan:                 meta.plan as any,
            status:               'ACTIVE',
            stripeCustomerId:     session.customer as string,
            stripeSubId:          session.subscription as string,
            currentPeriodStart:   new Date(),
            currentPeriodEnd:     new Date(Date.now() + (meta.plan === 'MONTHLY' ? 30 : 365) * 86400000),
            charityContribution:  charityContrib,
            prizePoolContribution: prizePoolContrib,
          },
          update: {
            status:               'ACTIVE',
            stripeCustomerId:     session.customer as string,
            stripeSubId:          session.subscription as string,
            currentPeriodStart:   new Date(),
            currentPeriodEnd:     new Date(Date.now() + (meta.plan === 'MONTHLY' ? 30 : 365) * 86400000),
            plan:                 meta.plan as any,
            charityContribution:  charityContrib,
            prizePoolContribution: prizePoolContrib,
          },
        }),
        db.charitySelection.upsert({
          where: { userId: meta.userId },
          create: {
            userId:             meta.userId,
            charityId:          meta.charityId,
            contributionPercent: parseFloat(meta.charityPercent),
          },
          update: {
            charityId:          meta.charityId,
            contributionPercent: parseFloat(meta.charityPercent),
          },
        }),
      ]);
      break;
    }

    // ── Subscription Renewed ─────────────────────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) break;

      await db.subscription.updateMany({
        where: { stripeSubId: invoice.subscription as string },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: new Date(invoice.period_start * 1000),
          currentPeriodEnd:   new Date(invoice.period_end * 1000),
        },
      });
      break;
    }

    // ── Subscription Cancelled ───────────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db.subscription.updateMany({
        where: { stripeSubId: sub.id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
      break;
    }

    // ── Payment Failed ───────────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) break;

      await db.subscription.updateMany({
        where: { stripeSubId: invoice.subscription as string },
        data: { status: 'LAPSED' },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

// Stripe needs the raw body, not parsed JSON
export const config = { api: { bodyParser: false } };
