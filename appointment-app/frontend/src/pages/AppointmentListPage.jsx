import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import AppointmentCard from '../components/AppointmentCard.jsx';

export default function AppointmentListPage() {
  const { user, logout } = useAuth();
  const [state, setState] = useState({ loading: true, error: '', data: [] });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: '' }));
      try {
        const { data } = await client.get('/appointments', { params: { upcoming: true } });
        if (!cancelled) setState({ loading: false, error: '', data: data.data });
      } catch {
        if (!cancelled) setState({ loading: false, error: 'Gagal memuat janji temu. Coba muat ulang halaman.', data: [] });
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Janji Temu</h1>
          <p className="subtitle">{user?.name} (zona waktu: {user?.preferredTimezone})</p>
        </div>
        <div className="header-actions">
          <Link className="btn-primary" to="/appointments/new">Buat janji temu</Link>
          <button type="button" className="btn-secondary" onClick={logout}>Keluar</button>
        </div>
      </header>

      {state.loading && <p className="state-text">Memuat janji temu...</p>}
      {!state.loading && state.error && <p className="error-text">{state.error}</p>}
      {!state.loading && !state.error && state.data.length === 0 && (
        <div className="empty-state">
          <p>Belum ada janji temu yang akan datang.</p>
          <Link className="btn-primary" to="/appointments/new">Buat yang pertama</Link>
        </div>
      )}
      {!state.loading && !state.error && state.data.length > 0 && (
        <div className="card-grid">
          {state.data.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} viewerTimezone={user.preferredTimezone} />
          ))}
        </div>
      )}
    </div>
  );
}
