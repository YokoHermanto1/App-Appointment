import { prisma } from '../config/prisma.js';

export async function getMe(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}

export async function listUsers(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, username: true, preferredTimezone: true },
    }),
    prisma.user.count(),
  ]);

  res.json({ data: users, page, limit, total, totalPages: Math.ceil(total / limit) });
}
