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

19. `020_payment_trial.sql` — trial 2 hari + tracking pembayaran iPaymu:
    `profiles.trial_ends_at` (kolom baru), RPC `start_trial()` (security
    definer, cuma bisa "mulai" sekali — dijaga `where trial_ends_at is
    null`, dipanggil client di `completeOnboarding()`), dan tabel
    `payments` (audit trail + idempotency key buat webhook, RLS read-only
    untuk owner, tulis cuma lewat service_role dari edge function).

## Pembayaran (iPaymu)

**Status saat ini: penguncian dimatikan.** `VITE_PAYMENT_ENABLED=false`
di `.env.local` (default kalau var-nya nggak ada sama sekali) bikin
`store.hasAccess` SELALU `true` — semua user akses penuh terlepas dari
trial/pembayaran. Ini sengaja, biar app bisa dipakai/launch dulu sebelum
payment gateway (iPaymu atau provider lain) selesai didaftarkan. Trial
tetap "berjalan" di background (`start_trial()` RPC tetap dipanggil,
`trial_ends_at` tetap keisi) — cuma penguncian aksesnya yang di-skip.

**Sebelum nyalain jadi `true`:** baca komentar `PAYMENT_ENABLED` di
`src/stores/wedding.js` dulu — user yang sudah onboarding SELAGI ini mati
bakal punya `trial_ends_at` yang udah lewat, jadi begitu saklar dinyalain
mereka langsung kekunci tanpa peringatan. Putuskan dulu mau di-grandfather
(reset `trial_ends_at` user lama lewat SQL) atau memang sengaja dikunci.

Alur (setelah dinyalain): user onboarding → trial 2 hari (`start_trial()`
RPC) → kalau trial habis & `profiles.paid_at` masih kosong,
`store.hasAccess` jadi `false` dan App.vue mengunci balik ke
`PaymentPage.vue` (lihat komentar di `020_payment_trial.sql` untuk alur
lengkap). Bayar QRIS lewat dua edge function di `supabase/functions/`:

- `create-payment` — dipanggil client (`store.createPayment()`), bikin
  transaksi QRIS baru di iPaymu, simpan baris `payments` (status
  `pending`), balikin data QR ke client.
- `ipaymu-webhook` — didaftarkan sebagai "Notify URL" di dashboard
  iPaymu. Saat status transaksi berubah, iPaymu POST ke sini; handler
  **tidak percaya body webhook mentah** — begitu dapat `trx_id`, dia
  query balik ke iPaymu buat konfirmasi status asli, baru update
  `payments.status` + `profiles.paid_at` (service_role, bypass RLS).

### Deploy

1. Install Supabase CLI kalau belum ada, lalu `supabase login` dan
   `supabase link --project-ref <project-ref-kamu>` di folder ini.
2. Set secret (nilai dari dashboard iPaymu — Pengaturan → API):
   ```
   supabase secrets set IPAYMU_VA=<nomor-va-kamu>
   supabase secrets set IPAYMU_API_KEY=<api-key-kamu>
   supabase secrets set IPAYMU_MODE=sandbox
   ```
   Ganti `IPAYMU_MODE` jadi `production` kalau sudah siap terima uang asli.
3. Deploy kedua function:
   ```
   supabase functions deploy create-payment
   supabase functions deploy ipaymu-webhook --no-verify-jwt
   ```
   `--no-verify-jwt` WAJIB untuk `ipaymu-webhook` — itu dipanggil iPaymu
   sendiri (bukan browser user), jadi tidak ada JWT Supabase yang bisa
   diverifikasi lewat jalur biasa.
4. Salin URL `ipaymu-webhook` (format
   `https://<project-ref>.supabase.co/functions/v1/ipaymu-webhook`), lalu
   daftarkan sebagai "Notify URL"/"Callback URL" di dashboard iPaymu.
5. Jalankan `020_payment_trial.sql` di SQL Editor.

### Catatan penting

- **Belum pernah dites end-to-end** terhadap API iPaymu asli (tidak ada
  akses ke akun/kredensial sandbox saat kode ini ditulis). Bentuk request
  & response mengikuti dokumentasi resmi iPaymu API v2 per pengetahuan
  terakhir — field response (`Data.QrString`, `Data.Status`, dst) sudah
  ditandai jelas di kedua file function kalau ternyata perlu disesuaikan.
  **Wajib coba dulu di mode sandbox** sebelum pasang di production, dan
  cek log function (`supabase functions logs create-payment` /
  `ipaymu-webhook`) kalau ada yang nggak sesuai — raw response iPaymu
  selalu di-log di sana.
- Harga hardcode Rp99.000 di `create-payment/index.ts` (`PRICE_IDR`) dan
  `PaymentPage.vue` (`PRICE`) — kalau mau ubah harga, dua tempat ini yang
  diedit.
- Trial cuma bisa dimulai SEKALI per user (guard di RPC) — refresh/login
  ulang tidak memperpanjang atau mereset trial.
