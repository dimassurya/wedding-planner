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
7. `007_fix_accept_invite_token_type.sql` — perbaikan khusus project ini:
   tabel `partner_invitations` ternyata sudah ada sebelum `001_schema.sql`
   pernah dijalankan (kolom `id`/`token` aslinya `uuid`, bukan
   `bigint`/`text` seperti asumsi awal), bikin `accept_partner_invite`
   gagal dengan "operator does not exist: uuid = text". Kalau kamu pasang
   app ini di project Supabase yang benar-benar baru (bukan project ini),
   kemungkinan besar file ini tidak dibutuhkan — cek dulu tipe kolom
   `partner_invitations` sebelum menjalankannya.
8. `008_enable_realtime_wave1.sql` — daftarkan `guests`/`timeline_tasks`
   ke publication `supabase_realtime`. **Wajib dijalankan** — bikin tabel
   baru lewat SQL tidak otomatis membuatnya ikut disiarkan realtime
   (beda dari `wedding_data` yang realtime-nya diaktifkan manual lewat
   toggle Dashboard di sesi yang jauh lebih awal). Tanpa ini, perubahan
   dari device lain baru kelihatan setelah refresh manual.
9. `009_fix_delete_realtime.sql` — set `REPLICA IDENTITY FULL` di
   `guests`/`timeline_tasks`. **Wajib dijalankan** — tanpa ini, event
   DELETE gagal cocok dengan filter realtime (`owner_user_id=eq...`)
   karena Postgres cuma menyertakan kolom primary key di data "row
   sebelum dihapus", bukan seluruh kolom. INSERT/UPDATE tidak kena
   masalah ini karena data barunya selalu lengkap.

10. `010_wave2_schema.sql` — Wave 2 migrasi normalisasi: tabel `vendors`,
    `budget_items`, `seserahan_items`, `mahar_items`. Dimigrasi bareng
    (bukan satu-satu) karena saling terkait — seserahan/mahar nyinkron
    otomatis ke budget, dan `budget_items."vendorId"` adalah FK ke
    `vendors`. Kolom sentinel lama (`id === 'seserahan_auto'`/`'mahar_auto'`)
    diganti kolom `"originType"` eksplisit, karena id sekarang selalu
    numerik asli dari server (tidak bisa lagi dobel fungsi sebagai
    penanda + id unik).
11. `011_wave2_rls.sql` — RLS untuk keempat tabel di atas, pola sama
    seperti `005_wave1_rls.sql`.
12. `012_wave2_backfill.sql` — pindahkan data lama dari kolom JSONB ke
    tabel baru. **Urutan di dalam file ini penting: vendors harus masuk
    duluan** (budget_items."vendorId" di-resolve lewat join ke
    vendors.legacy_id). **Sebelum menjalankan ini di database production,
    export data lewat tombol Ekspor di aplikasi dan simpan sebagai
    cadangan.**
13. `013_wave2_realtime.sql` — daftarkan keempat tabel ke publication
    `supabase_realtime` + set `replica identity full`. **Wajib
    dijalankan** (sama seperti `008`+`009` di Wave 1, digabung jadi satu
    file di sini).

14. `014_wave3_schema.sql` — Wave 3 migrasi normalisasi (yang terakhir &
    paling kompleks): tabel `admin_groups`/`admin_items` dan
    `checklist_groups`/`checklist_items`. Beda dari Wave 1/2 yang semua
    flat, ini struktur NESTED — satu grup punya banyak item, item butuh
    `group_id` (FK on delete cascade) yang cuma ada setelah grupnya
    selesai di-insert. `checklist_groups` punya kolom `position` (dipakai
    fitur drag-reorder fase yang beneran ada di UI); `admin_groups` dan
    semua tabel item sengaja tidak punya kolom itu (tidak ada UI reorder
    untuk itu).
15. `015_wave3_rls.sql` — RLS untuk keempat tabel di atas, pola sama
    seperti `005_wave1_rls.sql`/`011_wave2_rls.sql`.
16. `016_wave3_backfill.sql` — pindahkan data lama dari kolom JSONB ke
    tabel baru. **Urutan wajib: grup dulu, baru item** (item perlu
    `group_id` asli dari grup yang baru saja di-backfill). **Penting:**
    idempotency check untuk item di-scope ke `group_id` yang baru
    (bukan cuma `legacy_id` global) — id item di skema lama cuma unik
    di dalam satu grup (restart dari 1 tiap grup), jadi kalau dicek
    global bisa salah cocokin item dari grup berbeda. **Sebelum
    menjalankan ini di database production, export data lewat tombol
    Ekspor di aplikasi dan simpan sebagai cadangan.**
17. `017_wave3_realtime.sql` — daftarkan keempat tabel ke publication
    `supabase_realtime` + set `replica identity full`. **Wajib
    dijalankan.**

18. `018_rls_perf_optimize.sql` — optimasi performa RLS untuk skala besar.
    Semua policy (dari `002`/`005`/`011`/`015`) dibuat ulang dengan
    `auth.uid()` dibungkus jadi `(select auth.uid())`. Bedanya: `auth.uid()`
    telanjang dievaluasi ulang PER BARIS, sedangkan `(select auth.uid())`
    di-hoist Postgres jadi InitPlan (sekali per query). Semantik policy
    identik, cuma jauh lebih cepat untuk user dengan banyak baris. Ini
    pola resmi yang disarankan Supabase. **Tidak menyentuh data** — cuma
    definisi policy. Kalau memasang app di project baru, jalankan
    `002`/`005`/`011`/`015` dulu lalu `018` di akhir sebagai versi final
    policy.

Semua file idempoten (aman dijalankan ulang) — policy/fungsi lama dibersihkan
dulu sebelum dibuat ulang, tabel pakai `create table if not exists`.

**Checklist wajib tiap tabel baru** (pelajaran dari Wave 1, diterapkan
dari awal di Wave 2 & 3 — jangan sampai balik nemuin bug ini satu-satu lagi):
1. RLS policy (pola `018` — pakai `(select auth.uid())`, BUKAN `auth.uid()`
   telanjang, biar dievaluasi sekali per query bukan per baris).
2. Daftarkan ke publication `supabase_realtime` (pola `008`/`013`/`017`).
3. Set `replica identity full` (pola `009`/`013`/`017`) — supaya event
   DELETE bisa difilter dengan benar (tanpa ini DELETE nggak pernah
   realtime).

**Migrasi JSONB → tabel ternormalisasi SELESAI TOTAL** untuk semua 8
entity (guests, timeline, vendors, budget, seserahan, mahar, admin,
checklist) setelah Wave 3. `wedding_data` sekarang cuma menyimpan
`settings` yang masih relevan dibaca/ditulis kode aplikasi. Kolom JSONB
lama (`guests`/`timeline`/`budget`/`vendors`/`seserahan`/`mahar`/
`admin`/`checklist`) SENGAJA tidak dihapus dari `wedding_data` —
dibiarkan sebagai jaring pengaman rollback, tidak lagi dibaca/ditulis
oleh kode aplikasi.

**Belum ada di sini:** integrasi pembayaran (Stripe dkk). `profiles.paid_at`
sengaja tidak punya policy UPDATE untuk client (lihat komentar di
`002_rls_policies.sql`) — kalau nanti pembayaran diimplementasikan, isi
`paid_at` harus lewat service_role key di backend/edge function, bukan
lewat RLS yang bisa diakses user biasa.
