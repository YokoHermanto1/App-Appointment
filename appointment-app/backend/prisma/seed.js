import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A spread of timezones chosen so demo scenarios can hit real edge cases:
// Jakarta/Tokyo overlap fairly easily, Auckland barely overlaps with
// Jakarta at all under 08:00-17:00, and New York shows a large offset.
const users = [
  { name: 'Andi Wijaya', username: 'andi', preferredTimezone: 'Asia/Jakarta' },
  { name: 'Sarah Connor', username: 'sarah', preferredTimezone: 'Pacific/Auckland' },
  { name: 'Liam Smith', username: 'liam', preferredTimezone: 'America/New_York' },
  { name: 'Yuki Tanaka', username: 'yuki', preferredTimezone: 'Asia/Tokyo' },
];

async function main() {
  for (const u of users) {
    await prisma.user.upsert({ where: { username: u.username }, update: {}, create: u });
  }
  console.log('Seeded users:', users.map((u) => u.username).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
