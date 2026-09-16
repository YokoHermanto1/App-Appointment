import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

const TOKEN_TTL = '1h';

export async function register(req, res) {
  const { name, username, preferredTimezone } = req.body;

  if (!name?.trim() || !username?.trim() || !preferredTimezone?.trim()) {
    return res.status(400).json({ error: 'name, username, and preferredTimezone are required' });
  }

  try {
    const user = await prisma.user.create({
      data: { name: name.trim(), username: username.trim(), preferredTimezone: preferredTimezone.trim() },
    });
    return res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'username already taken' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
}

export async function login(req, res) {
  const { username } = req.body;
  if (!username?.trim()) {
    return res.status(400).json({ error: 'username is required' });
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (!user) {
    return res.status(404).json({ error: 'User not found. Please register first.' });
  }

  // Payload kept minimal (just the subject claim) so the JWT stays small -
  // the rest of the profile is fetched via GET /users/me when needed.
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

  return res.json({
    token,
    expiresIn: 3600,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      preferredTimezone: user.preferredTimezone,
    },
  });
}
