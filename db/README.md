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

Semua file idempoten (aman dijalankan ulang) — policy/fungsi lama dibersihkan
dulu sebelum dibuat ulang, tabel pakai `create table if not exists`.

**Belum ada di sini:** integrasi pembayaran (Stripe dkk). `profiles.paid_at`
sengaja tidak punya policy UPDATE untuk client (lihat komentar di
`002_rls_policies.sql`) — kalau nanti pembayaran diimplementasikan, isi
`paid_at` harus lewat service_role key di backend/edge function, bukan
lewat RLS yang bisa diakses user biasa.
