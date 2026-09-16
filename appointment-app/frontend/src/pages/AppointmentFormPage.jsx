import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppointmentFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [inviteeIds, setInviteeIds] = useState([]);
  const [error, setError] = useState('');
  const [violations, setViolations] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client
      .get('/users', { params: { limit: 100 } })
      .then(({ data }) => setUsers(data.data.filter((u) => u.id !== user.id)))
      .catch(() => setUsersError('Gagal memuat daftar pengguna.'));
  }, [user.id]);

  function toggleInvitee(id) {
    setInviteeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setViolations([]);

    if (!title.trim() || !date || !startTime || !endTime) {
      setError('Semua field wajib diisi.');
      return;
    }

    // Waktu diisi dalam zona waktu pembuat, lalu dikonversi ke UTC
    // sebelum dikirim - backend hanya menyimpan/menghitung dalam UTC.
    const startLocal = DateTime.fromISO(`${date}T${startTime}`, { zone: user.preferredTimezone });
    const endLocal = DateTime.fromISO(`${date}T${endTime}`, { zone: user.preferredTimezone });

    if (!startLocal.isValid || !endLocal.isValid || startLocal >= endLocal) {
      setError('Waktu mulai harus sebelum waktu selesai.');
      return;
    }

    setSubmitting(true);
    try {
      await client.post('/appointments', {
        title: title.trim(),
        start: startLocal.toUTC().toISO(),
        end: endLocal.toUTC().toISO(),
        inviteeIds,
      });
      navigate('/appointments');
    } catch (err) {
      if (err.response?.status === 422) {
        setError(err.response.data.error);
        setViolations(err.response.data.violations || []);
      } else {
        setError(err.response?.data?.error || 'Gagal membuat janji temu.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Buat Janji Temu</h1>
        <Link className="btn-secondary" to="/appointments">Batal</Link>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="title">Judul</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Sinkronisasi mingguan" />

        <div className="form-row">
          <div>
            <label htmlFor="date">Tanggal</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="start">Mulai</label>
            <input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label htmlFor="end">Selesai</label>
            <input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        <p className="hint-text">Waktu di atas mengikuti zona waktumu: {user.preferredTimezone}</p>

        <label>Undang peserta</label>
        {usersError && <p className="error-text">{usersError}</p>}
        <div className="invitee-list">
          {!usersError && users.length === 0 && <p className="state-text">Belum ada pengguna lain terdaftar.</p>}
          {users.map((u) => (
            <label key={u.id} className="invitee-item">
              <input type="checkbox" checked={inviteeIds.includes(u.id)} onChange={() => toggleInvitee(u.id)} />
              <span>{u.name}</span>
              <span className="tz-inline">{u.preferredTimezone}</span>
            </label>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}
        {violations.length > 0 && (
          <ul className="violation-list">
            {violations.map((v, i) => (
              <li key={i}>
                {v.timezone}: di luar jam kerja 08:00&ndash;17:00{v.localStart ? ` (waktu lokal ${v.localStart})` : ''}
              </li>
            ))}
          </ul>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Buat janji temu'}
        </button>
      </form>
    </div>
  );
}
