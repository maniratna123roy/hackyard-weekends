import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Admin User
  // Admin credentials per user instruction:
  // EMAIL: hackyard@weekend.com
  // PASSWORD / ACCESS CODE: hacktheweekend
  const adminEmail = 'hackyard@weekend.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Hackyard Chief Admin',
        username: 'hackyard_admin',
        role: 'admin',
        emailVerified: true,
        onboardingDone: true
      }
    });
    console.log(`✅ Admin user seeded: ${admin.email}`);
  }

  // 2. Seed a Sample Live Event
  let event = await prisma.event.findFirst();
  if (!event) {
    const now = new Date();
    event = await prisma.event.create({
      data: {
        title: 'Weekend Sprint #01 — Autonomous Systems & SaaS',
        description: '24-hour intense sprint for developers, designers, and marketers solving real problems for cutting-edge startups.',
        mode: 'online',
        registrationOpensAt: new Date(now.getTime() - 24 * 3600 * 1000),
        kickoffAt: new Date(now.getTime() - 2 * 3600 * 1000), // live now!
        deadlineAt: new Date(now.getTime() + 22 * 3600 * 1000), // 22 hours remaining
        judgingEndsAt: new Date(now.getTime() + 30 * 3600 * 1000),
        status: 'live',
        createdBy: admin.id
      }
    });
    console.log(`✅ Event seeded: ${event.title}`);
  }

  // 3. Seed a Sample Founder and Startup
  const founderEmail = 'alex@acmeai.io';
  let founder = await prisma.user.findUnique({ where: { email: founderEmail } });
  if (!founder) {
    founder = await prisma.user.create({
      data: {
        email: founderEmail,
        name: 'Alex Rivera',
        username: 'alex_acme',
        role: 'founder',
        emailVerified: true,
        onboardingDone: true
      }
    });
    console.log(`✅ Sample Founder seeded: ${founder.email}`);
  }

  let startup = await prisma.startup.findFirst({ where: { ownerId: founder.id } });
  if (!startup) {
    startup = await prisma.startup.create({
      data: {
        ownerId: founder.id,
        name: 'Acme Cloud AI',
        website: 'https://acmeai.io',
        stage: 'Seed Stage',
        description: 'Building next-generation autonomous pipeline observability and incident response.',
        status: 'approved'
      }
    });
    console.log(`✅ Sample Startup seeded: ${startup.name}`);
  }

  // 4. Seed a Mission
  let mission = await prisma.mission.findFirst({ where: { startupId: startup.id } });
  if (!mission) {
    mission = await prisma.mission.create({
      data: {
        eventId: event.id,
        startupId: startup.id,
        type: 'feature',
        title: 'Realtime Latency Anomaly Detector & Slack Alert Stream',
        summary: 'Build a lightweight streaming metric anomaly detector and format rich interactive Slack webhook alerts.',
        briefFull: '### The Challenge\n\nModern distributed clusters emit millions of log and trace spans per second. Developers struggle to notice subtle 95th percentile latency degradations before customers complain.\n\n### Your Objective\n1. Ingest simulated time-series latency events.\n2. Implement a streaming rolling-window detector.\n3. Send crisp Slack alerts with actionable graph previews and root-cause hints.\n\n### Deliverables\n- Working repository link with setup steps.\n- Live demo or test run video.',
        productUrl: 'https://acmeai.io',
        repoUrl: 'https://github.com/acmeai/latency-starter',
        solvedDefinition: 'Working detector with unit tests and clear alert payload',
        constraints: 'Must be written in TypeScript, Python, or Go.',
        teamCap: 5,
        blindJudging: false,
        status: 'approved',
        criteria: {
          create: [
            { name: 'Detection Accuracy & Logic', weight: 40, description: 'Sound anomaly threshold algorithm' },
            { name: 'Code Quality & Tests', weight: 30, description: 'Clean architecture and test verification' },
            { name: 'UI / Alert Experience', weight: 30, description: 'Actionable and clear alert output' }
          ]
        },
        rewards: {
          create: [
            { kind: 'cash', amount: 1500, currency: 'USD', description: '$1,500 Cash Bounty + Founder Interview', rank: 1 },
            { kind: 'swag', description: 'Acme AI Swag Kit & Cloud Credits', rank: 2 }
          ]
        }
      }
    });
    console.log(`✅ Sample Mission seeded: ${mission.title}`);
  }

  console.log('✨ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
