# Appointment Scheduler

Aplikasi manajemen janji temu dengan penanganan zona waktu antar-partisipan.
Backend: Node.js + Express + Prisma + PostgreSQL. Frontend: React + Vite.

## Struktur Proyek

```
appointment-app/
├── backend/   # REST API (Express + Prisma)
└── frontend/  # React SPA (Vite)
```

## Prasyarat

- Node.js 18+
- PostgreSQL berjalan lokal (atau kredensial ke instance PostgreSQL manapun)

## 1. Setup Backend

```bash
cd backend
cp .env.example .env
# edit .env: isi DATABASE_URL sesuai instance PostgreSQL kamu, dan JWT_SECRET bebas (string acak panjang)

npm install
npx prisma migrate dev --name init   # membuat tabel di database
npm run seed                          # opsional: isi 4 user contoh lintas zona waktu
npm run dev                           # jalan di http://localhost:4000
```

Cek backend hidup: `curl http://localhost:4000/health` → `{"status":"ok"}`

## 2. Setup Frontend

Di terminal terpisah:

```bash
cd frontend
npm install
npm run dev   # jalan di http://localhost:5173
```

Frontend otomatis memanggil backend di `http://localhost:4000/api`. Untuk
mengubahnya, buat file `frontend/.env` berisi `VITE_API_URL=http://host:port/api`.

## 3. Mencoba Aplikasi

1. Buka `http://localhost:5173`, klik **Daftar**, buat 2–3 user dengan zona waktu berbeda
   (atau jalankan `npm run seed` di folder backend untuk mendapat user `andi`, `sarah`, `liam`, `yuki`).
2. Login dengan salah satu username (tanpa password).
3. Klik **Buat janji temu**, isi tanggal/jam (dalam zona waktumu sendiri), undang peserta lain.
4. Coba jadwalkan di luar jam kerja salah satu peserta untuk melihat pesan error per-partisipan.
5. Login sebagai user lain untuk melihat waktu yang sama ditampilkan dalam zona waktu mereka.

## Menguji Sesi Kedaluwarsa

Token JWT berlaku 1 jam (`expiresIn: '1h'` di `authController.js`). Untuk menguji
tanpa menunggu, ubah sementara nilai ini ke `'10s'`, login, tunggu 10 detik, lalu
panggil endpoint terproteksi — server akan menolak dengan `401 Session expired`.

## Endpoint API Utama

| Method | Endpoint             | Keterangan                                   |
|--------|-----------------------|-----------------------------------------------|
| POST   | `/api/auth/register`  | Daftar user baru                              |
| POST   | `/api/auth/login`     | Login by username, mengembalikan JWT          |
| GET    | `/api/users`          | List user (paginated)                         |
| GET    | `/api/users/me`       | Profil user yang sedang login                 |
| POST   | `/api/appointments`   | Buat janji temu (divalidasi jam kerja semua partisipan) |
| GET    | `/api/appointments`   | List janji temu milik/mengundang user (paginated) |
| GET    | `/api/appointments/:id` | Detail satu janji temu                      |

## Catatan Desain

- **Penyimpanan waktu**: semua `start`/`end` disimpan UTC di database. Konversi ke
  zona waktu lokal hanya terjadi saat data dikirim ke/ditampilkan di client
  (lihat `src/utils/timezone.js` di backend, dan `AppointmentCard.jsx` di frontend).
- **Ada sedikit inkonsistensi di brief**: bagian 2 menyebut jam kerja 09:00–17:00,
  sedangkan bagian 4.4 & 6.1 menyebut 08:00–17:00. Implementasi ini mengikuti
  08:00–17:00 (bagian yang lebih spesifik/rinci). Ubah `WORK_START_HOUR` di
  `backend/src/utils/timezone.js` bila ternyata yang dimaksud 09:00.
- **DST**: ditangani otomatis oleh library `luxon`, yang membaca IANA timezone
  database (bukan offset UTC statis), jadi transisi DST sudah benar tanpa logika manual.
- **Edge case tanpa irisan jam kerja**: jika kombinasi zona waktu partisipan
  membuat jam kerja mereka tidak pernah beririsan, API mengembalikan `422` dengan
  detail per-partisipan (bukan pesan generik), sehingga frontend bisa menampilkan
  alasan yang jelas alih-alih retry tanpa arah.

