# PORPROV FUTSAL CMS — UI Only (v1.0)

Membangun seluruh antarmuka MVP (portal publik + konsol admin) dengan data contoh statis di frontend. Belum ada database, login nyata, atau backend — semua alur ditampilkan sebagai UI yang bisa diklik dan dinavigasi.

## Identitas Visual

- Gaya resmi PORPROV: putih bersih, teks navy `#0F172A`, aksen merah `#C81E1E`, emas `#F2C230`.
- Bahasa antarmuka: Bahasa Indonesia sepenuhnya.
- Semua warna sebagai token desain di `src/styles.css`; badge status (DRAFT, VERIFIED, ELIGIBLE, dll.) punya token warna khusus.
- Tipografi tegas dan padat, cocok untuk tabel data dan papan skor.

## Portal Publik

Header dengan pemilih kategori PUTRA / PUTRI (mengubah data yang tampil), navigasi: Beranda, Tim, Pemain, Jadwal, Hasil, Klasemen, Statistik, Pengumuman.

- Beranda: hero event, blok LIVE NOW, pertandingan berikutnya, hasil terbaru, cuplikan klasemen, top skor.
- Tim: kartu tim per kontingen; detail tim berisi skuad publik (nama, nomor, posisi, foto) — tanpa NIK, alamat, kontak, atau dokumen.
- Pemain: profil publik ringkas + statistik (gol, kartu, penampilan).
- Jadwal: dikelompokkan per tanggal, filter grup/venue.
- Hasil: daftar skor akhir; detail pertandingan berisi lineup, linimasa kejadian (gol, kartu, pergantian, timeout), dan ringkasan statistik.
- Klasemen: tabel per grup (Main, M, S, K, GM, GK, SG, Poin).
- Statistik: top skor, kartu, dan peringkat tim.
- Pengumuman: daftar + halaman detail.

## Konsol Admin

Layout terpisah dengan sidebar, penanda peran aktif, dan pengalih peran demo (SUPER_ADMIN, EVENT_ADMIN, FUTSAL_ADMIN, VERIFIER, COMPETITION_OPERATOR, MATCH_OPERATOR, CONTINGENT_ADMIN, TEAM_MANAGER) yang menyembunyikan/menampilkan menu dan tombol sesuai izin — murni tampilan.

- Login (form saja) dan Dashboard dengan ringkasan: kontingen, tim, pemain menunggu verifikasi, pertandingan hari ini.
- Kontingen: daftar, detail, form, badge status (DRAFT → SUBMITTED → UNDER_REVIEW → NEEDS_CORRECTION → VERIFIED → REJECTED → ACTIVE/INACTIVE).
- Tim: daftar per kontingen dan kategori, detail dengan tab Pemain / Official / Dokumen.
- Pemain: tabel dengan filter, form registrasi (identitas, data pribadi, kontak, foto, dokumen), panel status verifikasi & eligibility.
- Official: daftar dan form dengan posisi (Manajer, Pelatih Kepala, Asisten, Dokter, Fisio, Kit Manager, Lainnya).
- Dokumen: daftar metadata dokumen (jenis, versi, pengunggah, waktu, status) dengan pratinjau tiruan.
- Verifikasi: antrean kasus, halaman keputusan (Verifikasi / Minta Koreksi / Tolak) dengan alasan dan catatan; linimasa keputusan.
- Eligibility: papan status ELIGIBLE / NOT_ELIGIBLE / PENDING dengan daftar syarat terpenuhi.
- Kompetisi: kategori, stage, grup & undian (drag-free, pilih tim), venue.
- Jadwal: pembuatan dan penerbitan fixture.
- Match Center operator: mulai pertandingan, lineup, pencatatan kejadian (gol, own goal, kartu kuning/merah, pelanggaran, pergantian, timeout, penalti) dengan menit, akhiri pertandingan.
- Hasil: alur bertahap FINISHED → SUBMITTED → VERIFIED → PUBLISHED, klasemen hanya berubah setelah terverifikasi.
- Klasemen admin: tabel hasil hitung dari data contoh + tombol hitung ulang.
- Audit Log: tabel aktivitas (aktor, aksi, resource, waktu) dari data contoh.
- Notifikasi: panel in-app.

## Catatan Teknis

- Rute TanStack: publik di top-level (`/`, `/tim`, `/pemain`, `/jadwal`, `/hasil`, `/klasemen`, `/statistik`, `/pengumuman`, plus rute detail `$id`); admin di bawah prefiks `/admin/*` dengan layout sidebar sendiri.
- Data contoh dan tipe domain di `src/data/*` dan `src/types/*`: kontingen, tim, pemain, official, dokumen, kasus verifikasi, grup, venue, pertandingan, kejadian, hasil, klasemen (dihitung dari hasil, bukan angka statis), audit.
- Peran/izin/scope dimodelkan sebagai matriks di frontend (`src/lib/rbac.ts`) untuk mengendalikan tampilan menu dan tombol. Ini bukan batas keamanan — hanya simulasi UI.
- Setiap rute publik mendapat `head()` sendiri (judul, deskripsi, og).
- Komponen bersama: StatusBadge, DataTable, PageHeader, FilterBar, EmptyState, StepperStatus.

## Di Luar Cakupan Tahap Ini

Backend, autentikasi nyata, RLS, upload file, email/notifikasi nyata, dan seluruh item Out of Scope pada blueprint. Struktur data frontend dibuat agar mudah dipasangkan ke backend di tahap berikutnya.
