-- ============================================================
--  021_vendor_capacity.sql — kapasitas venue.
--  Kapasitas itu atribut milik VENUE (berapa orang muat), jadi rumah
--  datanya di record vendor — bukan di tab Tamu. Tab Tamu/Home cuma BACA
--  angka ini buat warning over-capacity (Σ pax tamu vs kapasitas venue
--  yang dipakai). Pola baca satu arah, sama seperti vendor per-pax yang
--  sudah baca jumlah tamu dari sisi sebaliknya — nggak ada angka yang
--  diduplikasi/nyimpen ganda.
--
--  Kolom ada di semua vendor (paling simpel), tapi cuma relevan &
--  ditampilkan buat category='venue'. Aman & non-destruktif: nambah 1
--  kolom dengan default 0.
-- ============================================================

alter table public.vendors add column if not exists kapasitas integer not null default 0;
