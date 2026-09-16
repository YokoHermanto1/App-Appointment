export default function TimezoneBadge({ timezone }) {
  const offset = (() => {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' });
      return dtf.formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? '';
    } catch {
      return '';
    }
  })();

  return (
    <span className="tz-badge">
      {timezone}
      {offset && <span className="tz-offset"> {offset}</span>}
    </span>
  );
}
