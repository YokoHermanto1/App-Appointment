import { prisma } from '../config/prisma.js';
import { validateWorkingHours } from '../utils/timezone.js';

const participantSelect = {
  select: { id: true, name: true, username: true, preferredTimezone: true },
};

export async function createAppointment(req, res) {
  const { title, start, end, inviteeIds = [] } = req.body;

  if (!title?.trim() || !start || !end) {
    return res.status(400).json({ error: 'title, start, and end are required' });
  }

  const startUtc = new Date(start);
  const endUtc = new Date(end);

  if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime())) {
    return res.status(400).json({ error: 'start and end must be valid ISO datetimes' });
  }
  if (startUtc >= endUtc) {
    return res.status(400).json({ error: 'start must be before end' });
  }

  const creator = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!creator) return res.status(404).json({ error: 'Creator not found' });

  const uniqueInviteeIds = [...new Set(inviteeIds)].filter((id) => id !== creator.id);
  const invitees = uniqueInviteeIds.length
    ? await prisma.user.findMany({ where: { id: { in: uniqueInviteeIds } } })
    : [];

  if (invitees.length !== uniqueInviteeIds.length) {
    return res.status(400).json({ error: 'One or more invitee IDs do not exist' });
  }

  // Working-hours rule is checked for the creator AND every invitee -
  // per brief 6.1, not just against whoever is creating the appointment.
  const participants = [
    { userId: creator.id, timezone: creator.preferredTimezone },
    ...invitees.map((u) => ({ userId: u.id, timezone: u.preferredTimezone })),
  ];

  const { valid, violations } = validateWorkingHours(startUtc, endUtc, participants);
  if (!valid) {
    return res.status(422).json({
      error: 'Appointment falls outside working hours (08:00-17:00) for one or more participants',
      violations,
    });
  }

  const appointment = await prisma.appointment.create({
    data: {
      title: title.trim(),
      start: startUtc,
      end: endUtc,
      creatorId: creator.id,
      invitees: { create: uniqueInviteeIds.map((userId) => ({ userId })) },
    },
    include: {
      creator: participantSelect,
      invitees: { include: { user: participantSelect } },
    },
  });

  res.status(201).json(appointment);
}

export async function listAppointments(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const upcomingOnly = req.query.upcoming !== 'false';

  const where = {
    AND: [
      upcomingOnly ? { end: { gte: new Date() } } : {},
      { OR: [{ creatorId: req.user.id }, { invitees: { some: { userId: req.user.id } } }] },
    ],
  };

  // Single query with `include` for creator + invitees avoids N+1 -
  // no per-row follow-up query for related users.
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { start: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: participantSelect,
        invitees: { include: { user: participantSelect } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({ data: appointments, page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getAppointment(req, res) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: {
      creator: participantSelect,
      invitees: { include: { user: participantSelect } },
    },
  });

  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

  const isParticipant =
    appointment.creatorId === req.user.id ||
    appointment.invitees.some((i) => i.userId === req.user.id);

  if (!isParticipant) return res.status(403).json({ error: 'Not authorized to view this appointment' });

  res.json(appointment);
}
