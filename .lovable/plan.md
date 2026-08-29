# Audit Codebase — PORPROV Sulsel 2026 Futsal

Hasil audit menyeluruh terhadap kode saat ini, lalu rencana perbaikan bertahap.

## Ringkasan temuan

Build preview saat ini **OK**, tetapi pemeriksaan tipe menemukan **126 error di 27 file**. Build lolos karena bundler tidak menjalankan typecheck — jadi banyak kesalahan ini baru muncul sebagai bug saat runtime.

### Kritis

1. **Tidak ada GRANT di migrasi database.** 12 file migrasi membuat ~30 tabel di skema `public` (roles, users, contingents, teams, players, documents, verification_*, audit_logs, dll) tanpa satu pun pernyataan `GRANT`. Tanpa itu, aplikasi tidak bisa membaca/menulis tabel lewat Data API — RLS saja tidak cukup. Semua fitur admin berbasis data akan gagal dengan permission error.
2. **Rute admin yang ditautkan tidak ada.** Sidebar menautkan `/admin/kompetisi`, `/admin/venue`, `/admin/jadwal`, `/admin/pertandingan`, `/admin/hasil`, `/admin/klasemen`, `/admin/notifikasi`, `/admin/audit` — kedelapan file rute belum dibuat, sehingga klik menu menghasilkan 404 (dan `admin.index.tsx` sudah error tipe karena menaut ke `/admin/pertandingan`).
3. **Pemanggilan server function salah bentuk.** Hook di `src/queries/*` dan `admin.kontingen.tsx` memanggil server function dengan argumen mentah (`fn(id)`, `fn({ id, input })`) padahal API menuntut `fn({ data: ... })`. Ini gagal saat runtime pada semua aksi verifikasi, eligibility, dan CRUD kontingen.
4. **API validator kedaluwarsa.** Server function memakai `.validator(...)`; versi TanStack Start di proyek ini memakai `.inputValidator(...)`.
5. **Auth context tidak konsisten.** `src/lib/auth.tsx` merujuk tipe `SessionState` yang tidak diimpor, dan mencampur `AuthorizationContext` dengan `SessionIdentity` serta `AuthSession` dengan `AuthenticatedSession` (5 error tipe). Status login bisa salah dibaca.

### Peringatan

6. **Impor Supabase salah sumber.** `src/lib/client.ts` dan `src/lib/server.ts` mengimpor `SupabaseClient` dari `@supabase/ssr`; tipe itu ada di `@supabase/supabase-js`.
7. **Akses env tidak sesuai konfigurasi TS.** `src/config/env.ts` dan `src/lib/server.ts` memakai `import.meta.env.VITE_...` sedangkan konfigurasi menuntut akses bracket (29 error TS4111 total).
8. **Uji tidak bisa dijalankan.** 8 file `*.test.ts` mengimpor `bun:test`, tapi tidak ada runner/tipe yang terpasang; `eligibility-service.test.ts` sendiri punya 32 error. Jaring pengaman untuk logika RBAC/eligibility praktis tidak aktif.
9. **`src/data/mock.ts` tidak aman indeks** (16 error): akses array tanpa penjagaan `undefined` pada generator kontingen, tim, pemain, dan perhitungan klasemen — berpotensi crash saat data digeser.
10. **File server function bukan pembungkus tipis.** `contingents.ts`, `eligibility.ts`, `verifications.ts` menaruh helper parsing di lingkup modul; pemisahan bundle bisa menghapus helper tersebut dan memunculkan `ReferenceError` di produksi meski typecheck lolos.
11. **`exactOptionalPropertyTypes`** dilanggar di `AdminPage.tsx`, DTO verifikasi, dan beberapa service (properti opsional dikirim bernilai `undefined`).

### Info

12. **Simulasi peran di sidebar** memilih peran aktif dari klien; otorisasi nyata ada di server/RLS, tapi perlu ditegaskan bahwa pemilih peran hanya alat demo, bukan sumber kebenaran.
13. **Aksesibilitas**: hanya 5 `aria-label` di seluruh komponen, sementara ada tombol ikon (pengalih kategori, tombol sidebar) tanpa label; perlu audit label + fokus terlihat.
14. **Metadata rute** sudah ada di semua rute yang dibuat; rute admin baru nanti harus ikut `noindex`.

## Rencana perbaikan (bertahap, tiap tahap diverifikasi)

**Tahap 1 — Kebenaran runtime (kritis)**
- Migrasi baru berisi `GRANT` untuk semua tabel publik sesuai kebijakan RLS yang ada (`authenticated`, `service_role`, `anon` hanya untuk tabel yang memang dibaca publik).
- Perbaiki pemanggilan server function ke bentuk `{ data }` di `src/queries/*` dan `admin.kontingen.tsx`.
- Ganti `.validator` → `.inputValidator` di seluruh `src/server-functions/*`.
- Rapikan `src/lib/auth.tsx` agar tipe sesi konsisten dengan `src/lib/session.ts`.

**Tahap 2 — Rute admin yang hilang**
- Buat 8 rute admin (Kategori & Grup, Venue, Jadwal, Match Center, Hasil, Klasemen, Notifikasi, Audit Log) memakai pola `AdminPage` + `DataTable` yang sudah ada, data dari `src/data/mock.ts`, lengkap dengan `head()` dan `noindex`.

**Tahap 3 — Kebersihan tipe**
- Perbaiki impor `SupabaseClient`, akses env bracket, pelanggaran `exactOptionalPropertyTypes`, dan penjagaan indeks di `mock.ts` sampai typecheck bersih.
- Pindahkan helper di file server function ke modul terpisah (pembungkus tipis).

**Tahap 4 — Uji & aksesibilitas**
- Pasang runner uji dan sesuaikan 8 file uji agar benar-benar berjalan (RBAC, eligibility, verifikasi).
- Tambah `aria-label` pada tombol ikon, pastikan indikator fokus dan target sentuh memadai.

## Catatan teknis

- Typecheck: `tsgo --noEmit` → 126 error (TS2322 39, TS4111 29, TS2345 18, TS2532 10, TS2307 8).
- File dengan error terbanyak: `eligibility-service.test.ts` (32), `contingents.ts` (16), `mock.ts` (16), `verification-service.test.ts` (12).
- Tidak ada perubahan skema tabel yang direncanakan di Tahap 1 — hanya penambahan hak akses.
