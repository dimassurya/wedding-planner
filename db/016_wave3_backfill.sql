-- ============================================================
--  016_wave3_backfill.sql — Backfill data lama (JSONB) ke tabel baru
--  admin_groups/admin_items, checklist_groups/checklist_items.
--  Jalankan setelah 014_wave3_schema.sql dan 015_wave3_rls.sql.
--
--  Idempoten: insert dijaga "not exists baris dgn legacy_id yang sama
--  utk owner yg sama", jadi aman dijalankan berulang kali.
--
--  URUTAN WAJIB: grup dulu, baru item — item butuh id ASLI grup (group_id)
--  yang cuma ada setelah grup selesai di-insert.
--
--  PENTING soal legacy_id item: id item di skema lama cuma unik DI DALAM
--  satu grup (restart dari 1 tiap grup) — makanya idempotency check utk
--  item di bawah di-scope ke group_id yang BARU, bukan cuma legacy_id
--  global. Kalau cuma cek legacy_id global, item dari grup berbeda yang
--  kebetulan sama legacy_id-nya bisa salah kecocokan (dianggap "udah ada"
--  padahal beda grup).
--
--  PENTING: sebelum menjalankan ini di database production sungguhan,
--  export dulu data lewat tombol Ekspor di aplikasi (store.exportAll())
--  dan simpan file JSON-nya di luar repo sebagai cadangan manual.
--  Kolom wedding_data.admin/checklist TIDAK disentuh oleh script ini
--  (cuma dibaca, tidak pernah di-update/delete).
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  1) admin_groups
-- ─────────────────────────────────────────────────────────────
insert into public.admin_groups (owner_user_id, legacy_id, grup)
select
  wd.user_id,
  (g->>'id')::int,
  coalesce(g->>'grup', '')
from public.wedding_data wd, jsonb_array_elements(wd.admin) g
where not exists (
  select 1 from public.admin_groups x
   where x.owner_user_id = wd.user_id and x.legacy_id = (g->>'id')::int
);


-- ─────────────────────────────────────────────────────────────
--  2) admin_items — group_id di-resolve lewat legacy_id grup yang
--     baru saja di-backfill; idempotency di-scope ke group_id baru
--     (bukan legacy_id global) karena id item lama collide antar grup.
-- ─────────────────────────────────────────────────────────────
insert into public.admin_items (owner_user_id, group_id, legacy_id, syarat, status)
select
  wd.user_id,
  ag.id,
  (i->>'id')::int,
  coalesce(i->>'syarat', ''),
  coalesce((i->>'status')::boolean, false)
from public.wedding_data wd
join lateral jsonb_array_elements(wd.admin) g on true
join public.admin_groups ag
  on ag.owner_user_id = wd.user_id and ag.legacy_id = (g->>'id')::int
join lateral jsonb_array_elements(g->'items') i on true
where not exists (
  select 1 from public.admin_items x
   where x.group_id = ag.id and x.legacy_id = (i->>'id')::int
);


-- ─────────────────────────────────────────────────────────────
--  3) checklist_groups — position diisi dari urutan asli array
--     lewat jsonb_array_elements(...) with ordinality (0-based).
-- ─────────────────────────────────────────────────────────────
insert into public.checklist_groups (owner_user_id, legacy_id, fase, position)
select
  wd.user_id,
  (g->>'id')::int,
  coalesce(g->>'fase', ''),
  (ord - 1)::int
from public.wedding_data wd
join lateral jsonb_array_elements(wd.checklist) with ordinality as t(g, ord) on true
where not exists (
  select 1 from public.checklist_groups x
   where x.owner_user_id = wd.user_id and x.legacy_id = (g->>'id')::int
);


-- ─────────────────────────────────────────────────────────────
--  4) checklist_items — sama pola seperti admin_items.
-- ─────────────────────────────────────────────────────────────
insert into public.checklist_items (owner_user_id, group_id, legacy_id, tugas, status)
select
  wd.user_id,
  cg.id,
  (i->>'id')::int,
  coalesce(i->>'tugas', ''),
  coalesce((i->>'status')::boolean, false)
from public.wedding_data wd
join lateral jsonb_array_elements(wd.checklist) g on true
join public.checklist_groups cg
  on cg.owner_user_id = wd.user_id and cg.legacy_id = (g->>'id')::int
join lateral jsonb_array_elements(g->'items') i on true
where not exists (
  select 1 from public.checklist_items x
   where x.group_id = cg.id and x.legacy_id = (i->>'id')::int
);
