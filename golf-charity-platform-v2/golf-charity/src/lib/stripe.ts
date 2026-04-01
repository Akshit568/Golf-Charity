// src/lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const PLANS = {
  MONTHLY: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    amount: 999,   // £9.99
    interval: 'month' as const,
    label: 'Monthly',
  },
  YEARLY: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    amount: 9900,  // £99.00
    interval: 'year' as const,
    label: 'Yearly',
  },
};

export async function createCheckoutSession({
  userId,
  email,
  plan,
  charityId,
  charityPercent,
}: {
  userId: string;
  email: string;
  plan: 'MONTHLY' | 'YEARLY';
  charityId: string;
  charityPercent: number;
}) {
  const selectedPlan = PLANS[plan];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: email,
    line_items: [
      {
        price: selectedPlan.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      plan,
      charityId,
      charityPercent: charityPercent.toString(),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?cancelled=true`,
  });

  return session;
}

export async function cancelSubscription(stripeSubId: string) {
  return stripe.subscriptions.cancel(stripeSubId);
}

export async function constructWebhookEvent(payload: Buffer, sig: string) {
  return stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
