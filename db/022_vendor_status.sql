-- ============================================================
--  022_vendor_status.sql — status lifecycle vendor.
--  Ganti toggle biner "jadi" (dipakai/belum) jadi status hubungan:
--  incar → dihubungi → dipakai → batal. Kolom `jadi` DIPERTAHANKAN
--  sebagai flag turunan (jadi = status==='dipakai') supaya semua kode
--  yang sudah baca v.jadi (jembatan ke Budget di handleVendorDecision,
--  filter kapasitas, dipakaiList, statistik) tetap jalan tanpa disentuh.
--  "dipakai" = perilaku lama jadi=true: harga masuk ke Budget otomatis.
--
--  Catatan: progres bayar (DP/lunas) TIDAK jadi status di sini — itu
--  fakta uang yang tinggal di baris Budget vendor (dibayar vs aktual).
--  Status vendor = tahap hubungan, Budget = tahap pembayaran. Dipisah
--  biar nggak ada dua sumber kebenaran.
--
--  Aman & non-destruktif: nambah 1 kolom + backfill dari data yang ada.
-- ============================================================

alter table public.vendors add column if not exists status text not null default 'incar';

-- Backfill: vendor yang sudah "dipakai" (jadi=true) → status 'dipakai'.
-- Sisanya biar default 'incar' (kita nggak punya data tahap "dihubungi"
-- historis, jadi mulai dari incar aja).
update public.vendors set status = 'dipakai' where jadi = true and status = 'incar';
