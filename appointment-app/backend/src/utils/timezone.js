import { DateTime } from 'luxon';

// Per brief section 4.4: scheduling is only allowed within 08:00-17:00
// local time, checked against EVERY participant, not just the creator.
export const WORK_START_HOUR = 8;
export const WORK_END_HOUR = 17;

/**
 * Checks whether a UTC [start, end) range falls within working hours for
 * every given participant's IANA timezone, using Luxon so DST transitions
 * are resolved automatically from the tz database (no manual offset math).
 *
 * @param {Date} startUtc
 * @param {Date} endUtc
 * @param {{ userId: string, timezone: string }[]} participants
 * @returns {{ valid: boolean, violations: Array<object> }}
 */
export function validateWorkingHours(startUtc, endUtc, participants) {
  const violations = [];

  for (const p of participants) {
    const localStart = DateTime.fromJSDate(startUtc, { zone: 'utc' }).setZone(p.timezone);
    const localEnd = DateTime.fromJSDate(endUtc, { zone: 'utc' }).setZone(p.timezone);

    if (!localStart.isValid || !localEnd.isValid) {
      violations.push({ userId: p.userId, timezone: p.timezone, reason: 'invalid_timezone' });
      continue;
    }

    // Reject ranges that cross local midnight - a 16:00-18:00 UTC meeting
    // can otherwise land as "yesterday 23:00 to today 01:00" somewhere else.
    const sameLocalDay = localStart.hasSame(localEnd, 'day');
    const startWithinHours = localStart.hour >= WORK_START_HOUR;
    const endWithinHours =
      localEnd.hour < WORK_END_HOUR || (localEnd.hour === WORK_END_HOUR && localEnd.minute === 0);

    if (!sameLocalDay || !startWithinHours || !endWithinHours) {
      violations.push({
        userId: p.userId,
        timezone: p.timezone,
        reason: 'outside_working_hours',
        localStart: localStart.toFormat('yyyy-LL-dd HH:mm'),
        localEnd: localEnd.toFormat('yyyy-LL-dd HH:mm'),
      });
    }
  }

  return { valid: violations.length === 0, violations };
}
