import { PrismaClient } from '@prisma/client';

// Single shared instance so we don't exhaust Postgres connections
// by creating a new PrismaClient per request.
export const prisma = new PrismaClient();
