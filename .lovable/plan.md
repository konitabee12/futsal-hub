# Melengkapi Rute Admin yang Belum Ada

Sidebar konsol admin menautkan 8 halaman yang file rutenya belum dibuat, sehingga menu tersebut menghasilkan 404 (dan tautan `/admin/pertandingan` di dashboard sudah memicu error tipe). Halaman Eligibility (`admin.eligibility.tsx`) sudah ada, jadi tidak dibuat ulang.

## Halaman yang dibuat

| Rute | Judul | Isi |
| --- | --- | --- |
| `/admin/kompetisi` | Kategori & Grup | Grup Putra/Putri, jumlah tim per grup, daftar tim anggota, format kompetisi |
| `/admin/venue` | Venue | Nama lapangan, lokasi, kapasitas, jumlah pertandingan terjadwal |
| `/admin/jadwal` | Jadwal | Tabel pertandingan per tanggal dengan filter grup dan venue, status jadwal |
| `/admin/pertandingan` | Match Center | Daftar pertandingan berjalan/berikutnya, panel skor & kejadian (tampilan saja) |
| `/admin/hasil` | Hasil | Skor akhir, status verifikasi hasil, dan tombol aksi sesuai izin |
| `/admin/klasemen` | Klasemen | Tabel klasemen per grup dari `computeStandings`, dengan info kalkulasi terakhir |
| `/admin/notifikasi` | Notifikasi | Daftar notifikasi sistem dari data mock, dikelompokkan menurut jenis |
| `/admin/audit` | Audit Log | Riwayat aksi (aktor, aksi, resource, waktu) dari `auditLog` |

## Pola yang dipakai

Semua halaman mengikuti pola yang sudah ada di `src/routes/admin.official.tsx`:
- Dibungkus `AdminPage` dengan `permission` yang sama seperti di sidebar (`competition.view`, `venue.view`, `schedule.view`, `match.view`, `result.view`, `standings.view`, `notification.view`, `audit.view`) sehingga peran yang tidak berhak melihat `NoAccess`.
- Tabel memakai `DataTable` / `Row` / `Cell`, status memakai `StatusBadge` dan label Bahasa Indonesia dari `src/lib/labels.ts`.
- Data diambil dari `src/data/mock.ts` (`matches`, `groups`, `venues`, `teams`, `computeStandings`, `notifications`, `auditLog`) — tanpa perubahan pada service, repository, atau database.
- Kategori aktif (Putra/Putri) mengikuti `CategoryProvider` seperti halaman admin lain.
- Setiap rute punya `head()` sendiri: judul dan deskripsi unik dalam Bahasa Indonesia plus `robots: noindex`.

## Catatan teknis

- Nama file mengikuti konvensi titik: `src/routes/admin.kompetisi.tsx`, `admin.venue.tsx`, `admin.jadwal.tsx`, `admin.pertandingan.tsx`, `admin.hasil.tsx`, `admin.klasemen.tsx`, `admin.notifikasi.tsx`, `admin.audit.tsx`, dengan `createFileRoute("/admin/<segmen>")`.
- `src/routeTree.gen.ts` dibiarkan digenerate otomatis.
- Setelah semua rute ada, error tautan `/admin/pertandingan` di `admin.index.tsx` hilang dengan sendirinya; build diverifikasi setelah pembuatan.
- Temuan audit lain (GRANT database, bentuk pemanggilan server function, error tipe) tidak disentuh di sini dan bisa dikerjakan terpisah.
