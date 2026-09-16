# Technical Q&A

## 1. Timezone Conflicts

Semua datetime disimpan dalam UTC di database — ini single source of truth. Konversi ke waktu lokal hanya terjadi di dua titik: saat validasi input (UTC → waktu lokal tiap partisipan) dan saat ditampilkan ke user (UTC → timezone user yang sedang login).

Saat appointment dibuat, backend mengecek jam kerja (08:00-17:00) untuk **setiap partisipan** (pembuat dan semua yang diundang), bukan hanya pembuat appointment-nya. Pengecekan pakai library `luxon` dengan IANA timezone database, supaya perbedaan DST antar wilayah otomatis ditangani dengan benar, tanpa perlu hitung offset manual yang rawan salah.

Ada satu edge case yang sengaja ditangani secara eksplisit: appointment yang waktu lokalnya menyebrang tengah malam untuk suatu partisipan. Kalau pengecekan cuma membandingkan angka jam mulai dan jam selesai secara terpisah (jam mulai >= 8, jam selesai < 17), itu bisa lolos validasi padahal sebenarnya salah — misalnya rentang 23:00 sampai 01:00 keesokan harinya: 23 >= 8 bernilai benar, dan 1 < 17 juga bernilai benar, padahal jam segitu jelas di luar jam kerja. Karena itu ditambahkan pengecekan bahwa waktu mulai dan waktu selesai harus berada di hari lokal yang sama sebelum jam-nya dicek satu per satu.

Kalau ada partisipan yang jadwalnya bentrok dengan jam kerja, sistem mengembalikan daftar pelanggaran per-user (bukan cuma pesan error generik), supaya user tahu persis siapa yang bentrok dan di jam berapa.

## 2. Database Optimization

Index ditaruh di kolom yang paling sering dipakai untuk filter dan sort: `creator_id` (untuk query "appointment saya"), `start` (untuk urutkan dan filter appointment yang akan datang), serta `user_id` dan `appointment_id` di tabel junction `appointment_invitees`, karena query "appointment yang melibatkan saya sebagai undangan" selalu melewati tabel ini.

N+1 query dihindari dengan memakai `include` di Prisma, supaya data creator dan invitee ikut terambil dalam satu query saat mengambil daftar appointment, bukan query terpisah untuk tiap baris.

Endpoint list appointment juga menerapkan pagination (`page`, `limit`, default 20, maksimum 100 per halaman), supaya query tetap ringan meskipun jumlah data sudah sangat besar.

Untuk skala yang lebih besar, langkah lanjutan yang bisa dipertimbangkan (belum diimplementasikan di sini): composite index untuk kombinasi filter yang sering dipakai bersamaan, connection pooling, dan caching layer untuk data yang jarang berubah.

## 3. Additional Features

Kalau dikembangkan menjadi produk nyata, beberapa fitur tambahan yang menurut saya penting:

- **Notifikasi** (email atau push) untuk undangan appointment baru dan reminder sebelum jadwal dimulai — supaya partisipan tidak perlu terus mengecek aplikasi secara manual.
- **Reschedule dan cancel** appointment, dengan histori perubahan tersimpan — di dunia nyata jadwal sering berubah, dan penting ada jejak siapa yang mengubah apa.
- **Deteksi bentrok jadwal (double-booking)** — mengecek apakah seorang partisipan sudah punya appointment lain di rentang waktu yang sama, sebelum appointment baru dikonfirmasi.
- **Tampilan availability lintas partisipan** sebelum memilih waktu, supaya user tidak coba-coba submit dan baru tahu ada masalah jam kerja setelah ditolak sistem.

## 4. Session Management

Payload JWT sengaja dibuat minimal — hanya berisi `sub` (user id), tanpa menyertakan data profil seperti nama atau timezone. Data lain diambil lewat endpoint terpisah saat dibutuhkan.

Alasannya: data seperti timezone bisa berubah sewaktu-waktu (misalnya user pindah kota), sementara isi JWT bersifat tetap sejak diterbitkan sampai kedaluwarsa. Kalau timezone ikut disimpan di dalam token, backend bisa memakai data yang sudah basi untuk validasi jam kerja appointment, walaupun user sudah mengubah preferensinya. Dengan payload minimal, data yang berubah selalu diambil langsung dari database, sehingga selalu up to date.

Kedaluwarsa sesi ditegakkan di sisi server: token diberi masa berlaku 1 jam (`expiresIn: '1h'`), dan `jwt.verify()` otomatis menolak token yang sudah lewat masa berlakunya — jadi ini bukan aturan yang hanya dipatuhi di sisi client.

Soal penyimpanan token: di frontend token disimpan di `localStorage`, yang praktis untuk keperluan demo. Namun saya sadar ini punya risiko keamanan (rentan terhadap serangan XSS) dibandingkan `httpOnly` cookie. Untuk implementasi produksi, `httpOnly` cookie akan menjadi pilihan yang lebih aman karena tidak bisa diakses langsung lewat JavaScript di browser.