import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const COMMON_TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Pacific/Auckland',
  'Australia/Sydney',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', username: '', preferredTimezone: 'Asia/Jakarta' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.username.trim()) {
      setError('Nama dan username wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.response?.data?.error || 'Pendaftaran gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Daftar</h1>

        <label htmlFor="name">Nama</label>
        <input id="name" value={form.name} onChange={update('name')} placeholder="Nama lengkap" />

        <label htmlFor="username">Username</label>
        <input id="username" value={form.username} onChange={update('username')} placeholder="mis. andi" />

        <label htmlFor="tz">Zona waktu</label>
        <select id="tz" value={form.preferredTimezone} onChange={update('preferredTimezone')}>
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">Berhasil didaftarkan. Mengalihkan ke halaman masuk...</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Daftar'}
        </button>

        <p className="auth-footer">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </form>
    </div>
  );
}
