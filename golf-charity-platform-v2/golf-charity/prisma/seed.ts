// prisma/seed.ts
// Run: npx ts-node prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('admin123!', 12);
  const admin = await db.user.upsert({
    where: { email: 'admin@fairwayandgood.com' },
    update: {},
    create: {
      email:        'admin@fairwayandgood.com',
      name:         'Platform Admin',
      passwordHash: adminHash,
      role:         'ADMIN',
    },
  });
  console.log('✅ Admin:', admin.email);

  // Test subscriber
  const userHash = await bcrypt.hash('test1234!', 12);
  const testUser = await db.user.upsert({
    where: { email: 'golfer@test.com' },
    update: {},
    create: {
      email:        'golfer@test.com',
      name:         'Alex Test',
      passwordHash: userHash,
      role:         'SUBSCRIBER',
    },
  });
  console.log('✅ Test user:', testUser.email);

  // Charities
  const charities = [
    {
      name:        'The R&A Foundation',
      description: 'Supporting grassroots golf development and bringing the game to communities that have never had access to it. Funding coaching, facilities, and equipment for young players across the UK.',
      featured:    true,
      imageUrl:    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&q=80',
      websiteUrl:  'https://www.randa.org',
    },
    {
      name:        'Golf Foundation',
      description: 'Introducing golf to young people, including those with disabilities and from disadvantaged backgrounds. Over 300,000 young people introduced to golf each year.',
      featured:    true,
      imageUrl:    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&q=80',
      websiteUrl:  'https://www.golf-foundation.org',
    },
    {
      name:        'Prostate Cancer UK',
      description: 'Using the power of golf to fight prostate cancer. Golf community fundraising has raised millions for research and patient support across the United Kingdom.',
      featured:    true,
      imageUrl:    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
    },
    {
      name:        'Children with Cancer UK',
      description: 'A leading national children\'s charity, dedicated to the fight against childhood cancer through funding research and supporting the families of children affected.',
      featured:    false,
      imageUrl:    null,
    },
    {
      name:        'Macmillan Cancer Support',
      description: 'Providing physical, financial and emotional support to help people through cancer. The golf community has long been one of Macmillan\'s strongest supporters.',
      featured:    false,
    },
  ];

  for (const c of charities) {
    await db.charity.upsert({
      where:  { id: c.name }, // won't match — just create
      update: {},
      create: { ...c, active: true },
    }).catch(async () => {
      // Charity may already exist by name match
      const exists = await db.charity.findFirst({ where: { name: c.name } });
      if (!exists) await db.charity.create({ data: { ...c, active: true } });
    });
  }
  console.log('✅ Charities seeded');

  // Test subscription for test user
  const charity = await db.charity.findFirst();
  if (charity) {
    await db.subscription.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId:               testUser.id,
        plan:                 'MONTHLY',
        status:               'ACTIVE',
        currentPeriodStart:   new Date(),
        currentPeriodEnd:     new Date(Date.now() + 30 * 86400000),
        charityContribution:  0.999,  // 10% of £9.99
        prizePoolContribution: 8.991, // 90% of £9.99
      },
    });

    await db.charitySelection.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId:             testUser.id,
        charityId:          charity.id,
        contributionPercent: 10,
      },
    });
    console.log('✅ Test subscription created');

    // Test scores
    const scoreValues = [32, 28, 35, 21, 30];
    for (let i = 0; i < scoreValues.length; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      await db.golfScore.create({
        data: { userId: testUser.id, score: scoreValues[i], datePlayed: date },
      }).catch(() => {});
    }
    console.log('✅ Test scores seeded');
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Admin login:    admin@fairwayandgood.com / admin123!');
  console.log('Test user login: golfer@test.com / test1234!');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
