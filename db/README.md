# Database migrations

Skema ini dipakai oleh `src/stores/wedding.js` dkk untuk konek ke Supabase.
Kalau app ini dipasang di project Supabase yang baru, jalankan file di
folder ini **berurutan** lewat Supabase Dashboard → SQL Editor (atau
`supabase db execute` / CLI migration kalau pipeline-nya sudah pakai itu):

1. `001_schema.sql` — tabel `profiles`, `wedding_data`, `partner_invitations`
   + trigger auto-provisioning profil saat user baru signup.
2. `002_rls_policies.sql` — Row Level Security untuk ketiga tabel di atas.
3. `003_functions.sql` — RPC `accept_partner_invite`, `leave_partnership`,
   `expire_old_invitations` yang dipanggil dari store (`supabase.rpc(...)`).
4. `004_wave1_schema.sql` — Wave 1 migrasi normalisasi: tabel `guests`,
   `timeline_tasks` (satu baris per entity, bukan lagi array JSONB di
   `wedding_data`), supaya realtime sync beroperasi per-baris.
5. `005_wave1_rls.sql` — RLS untuk `guests`/`timeline_tasks` (akses
   partner dicek lewat EXISTS ke `wedding_data`, karena tabel ini tidak
   punya kolom `partner_user_id` sendiri).
6. `006_wave1_backfill.sql` — pindahkan data lama dari kolom JSONB
   `wedding_data.guests`/`wedding_data.timeline` ke tabel baru. **Sebelum
   menjalankan ini di database production, export data lewat tombol
   Ekspor di aplikasi dan simpan sebagai cadangan.**

Semua file idempoten (aman dijalankan ulang) — policy/fungsi lama dibersihkan
dulu sebelum dibuat ulang, tabel pakai `create table if not exists`.

**Migrasi bertahap sedang berjalan:** `wedding_data` masih menyimpan
`budget`/`vendors`/`seserahan`/`mahar`/`admin`/`checklist` sebagai kolom
JSONB (belum dinormalisasi — itu Wave 2 & 3 di masa depan). Kolom
`wedding_data.guests`/`wedding_data.timeline` yang lama SENGAJA tidak
dihapus setelah Wave 1 — dibiarkan sebagai jaring pengaman rollback,
tidak lagi dibaca/ditulis oleh kode aplikasi.

**Belum ada di sini:** integrasi pembayaran (Stripe dkk). `profiles.paid_at`
sengaja tidak punya policy UPDATE untuk client (lihat komentar di
`002_rls_policies.sql`) — kalau nanti pembayaran diimplementasikan, isi
`paid_at` harus lewat service_role key di backend/edge function, bukan
lewat RLS yang bisa diakses user biasa.
