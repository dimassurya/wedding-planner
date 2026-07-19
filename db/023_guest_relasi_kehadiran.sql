-- ============================================================
--  023_guest_relasi_kehadiran.sql — rename status→relasi, pisah
--  kehadiran dari konfirmasi (Tab Tamu, dari review UX).
--
--  Masalah lama: kolom bernama `status` isinya relasi (cpp/teman_pria/
--  dst) — bentrok nama sama konsep "status" yang beda arti di tab lain
--  (mis. status pembayaran vendor). Dan `konfirmasi` (boolean) nyampur
--  dua makna: "sudah pasti diundang" vs "sudah membalas RSVP" — makanya
--  statistik yang dihitung darinya nggak jelas artinya.
--
--  Fix:
--  1. status → relasi (rename kolom, isi tidak berubah).
--  2. kehadiran (baru): belum / hadir / tidak / virtual. Default 'belum'
--     (= "diundang, belum diputuskan" — TETAP dihitung di statistik,
--     sama seperti perilaku lama konfirmasi=true). 'tidak' baru
--     dikeluarkan dari statistik. 'virtual' konsep baru (nggak butuh
--     kursi/katering fisik).
--  3. Kolom `konfirmasi` (boolean) SENGAJA TIDAK dihapus — jaring
--     pengaman rollback, sama pola seperti migrasi-migrasi sebelumnya.
--     Kode aplikasi berhenti membaca/menulis kolom ini setelah file ini.
--
--  Idempoten: rename dijaga cek information_schema, kolom baru pakai
--  add column if not exists.
-- ============================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'guests' and column_name = 'status'
  ) then
    alter table public.guests rename column status to relasi;
  end if;
end $$;

alter table public.guests add column if not exists kehadiran text not null default 'belum'
  check (kehadiran in ('belum', 'hadir', 'tidak', 'virtual'));

-- Backfill: tamu yang dulu eksplisit konfirmasi=false → 'tidak'.
-- Sisanya (konfirmasi=true, mayoritas/default) biarkan 'belum' — itu
-- sudah default kolom di atas, dan tetap dihitung di statistik (identik
-- perilaku lama), cuma sekarang jujur bilang "belum diputuskan" alih-alih
-- diklaim "dikonfirmasi" padahal belum tentu.
update public.guests set kehadiran = 'tidak' where konfirmasi = false and kehadiran = 'belum';
