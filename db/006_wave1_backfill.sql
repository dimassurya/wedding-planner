-- ============================================================
--  006_wave1_backfill.sql — Backfill data lama (JSONB) ke tabel baru
--  Jalankan setelah 004_wave1_schema.sql dan 005_wave1_rls.sql.
--
--  Idempoten: tiap insert dijaga "not exists baris dgn legacy_id yang
--  sama utk owner yg sama", jadi aman dijalankan berulang kali.
--
--  PENTING: sebelum menjalankan ini di database production sungguhan,
--  export dulu data lewat tombol Ekspor di aplikasi (store.exportAll())
--  dan simpan file JSON-nya di luar repo sebagai cadangan manual.
--  Kolom wedding_data.guests/wedding_data.timeline TIDAK disentuh oleh
--  script ini (cuma dibaca, tidak pernah di-update/delete).
-- ============================================================

insert into public.guests (owner_user_id, legacy_id, nama, jumlah, undangan, status, konfirmasi, catatan)
select
  wd.user_id,
  (g->>'id')::int,
  coalesce(g->>'nama', ''),
  coalesce((g->>'jumlah')::int, 1),
  coalesce(g->>'undangan', 'keduanya'),
  coalesce(g->>'status', 'lainnya'),
  coalesce((g->>'konfirmasi')::boolean, true),
  coalesce(g->>'catatan', '')
from public.wedding_data wd, jsonb_array_elements(wd.guests) g
where not exists (
  select 1 from public.guests x
   where x.owner_user_id = wd.user_id and x.legacy_id = (g->>'id')::int
);


insert into public.timeline_tasks (owner_user_id, legacy_id, tugas, deadline, status, pic, "tanggalSelesai", catatan)
select
  wd.user_id,
  (t->>'id')::int,
  coalesce(t->>'tugas', ''),
  nullif(t->>'deadline', '')::date,
  coalesce(t->>'status', 'belum'),
  coalesce(t->>'pic', ''),
  nullif(t->>'tanggalSelesai', '')::date,
  coalesce(t->>'catatan', '')
from public.wedding_data wd, jsonb_array_elements(wd.timeline) t
where not exists (
  select 1 from public.timeline_tasks x
   where x.owner_user_id = wd.user_id and x.legacy_id = (t->>'id')::int
);
