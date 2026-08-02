-- ============================================================
--  026_timeline_dates.sql — kolom tanggal yang dibutuhkan tab Timeline.
--
--  Tab Timeline (dulu "Agenda") dirombak jadi halaman READ-ONLY yang
--  cuma menampilkan semua data bertanggal dari modul lain. Supaya bisa
--  begitu, modul asalnya yang harus punya tempat nyimpen tanggalnya —
--  Timeline sendiri TIDAK punya tabel/kolom apa pun. Tiga kolom di bawah
--  ini melengkapi tanggal yang belum ada rumahnya:
--
--   1. vendors.jadwal        — daftar janji bertanggal dengan vendor
--                              (meeting, food testing, survey lokasi,
--                              fitting, gladi bersih, dst). Bentuknya
--                              jsonb array, satu kolom buat semua jenis
--                              jadwal, biar nggak perlu kolom baru tiap
--                              kali ada jenis janji baru:
--                              [{ jenis, judul, tanggal, status, catatan }]
--   2. admin_items.tanggal   — tanggal per syarat dokumen (jadwal KUA,
--                              pengambilan buku nikah, legalisasi, dll).
--                              Nullable: syarat tanpa tanggal tetap
--                              normal, cuma nggak nongol di Timeline.
--   3. wedding_gifts."tanggalPenyerahan"
--                            — pasangan dari "tanggalPembelian" yang
--                              sudah ada, buat mahar/seserahan yang
--                              punya jadwal serah terima sendiri.
--
--  Tanggal Lamaran/Akad/Resepsi TIDAK butuh migrasi: nebeng di
--  wedding_data.settings->couple, satu rumah dengan tanggal Hari-H.
--
--  WAJIB dijalankan sebelum memakai versi aplikasi ini. Tanpa kolom
--  `vendors.jadwal`, SEMUA penyimpanan vendor akan gagal (payload dari
--  client selalu menyertakan field ini).
--
--  Aman & non-destruktif: cuma menambah kolom, tidak menyentuh data yang
--  sudah ada. Ketiga tabel sudah `replica identity full` (013/017), jadi
--  kolom baru otomatis ikut ke payload realtime tanpa perubahan lain.
-- ============================================================

alter table public.vendors
  add column if not exists jadwal jsonb not null default '[]'::jsonb;

alter table public.admin_items
  add column if not exists tanggal date;

alter table public.wedding_gifts
  add column if not exists "tanggalPenyerahan" date;
