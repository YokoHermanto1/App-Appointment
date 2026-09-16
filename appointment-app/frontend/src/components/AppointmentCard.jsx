import { DateTime } from 'luxon';
import TimezoneBadge from './TimezoneBadge.jsx';

export default function AppointmentCard({ appointment, viewerTimezone }) {
  const start = DateTime.fromISO(appointment.start, { zone: 'utc' }).setZone(viewerTimezone);
  const end = DateTime.fromISO(appointment.end, { zone: 'utc' }).setZone(viewerTimezone);

  return (
    <article className="card">
      <h3>{appointment.title}</h3>
      <p className="card-time">
        {start.toFormat('ccc, dd LLL yyyy')} &middot; {start.toFormat('HH:mm')}&ndash;{end.toFormat('HH:mm')}
      </p>
      <TimezoneBadge timezone={viewerTimezone} />
      <p className="card-meta">Dibuat oleh {appointment.creator.name}</p>
      {appointment.invitees.length > 0 && (
        <p className="card-meta">
          Bersama {appointment.invitees.map((i) => i.user.name).join(', ')}
        </p>
      )}
    </article>
  );
}
