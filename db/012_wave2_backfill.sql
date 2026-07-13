-- ============================================================
--  012_wave2_backfill.sql — Backfill data lama (JSONB) ke tabel baru
--  Jalankan setelah 010_wave2_schema.sql dan 011_wave2_rls.sql.
--
--  Idempoten: tiap insert dijaga "not exists baris dgn legacy_id yang
--  sama utk owner yg sama", jadi aman dijalankan berulang kali.
--
--  URUTAN PENTING: vendors HARUS masuk duluan, sebelum budget_items —
--  budget_items."vendorId" perlu di-resolve lewat join ke vendors.legacy_id
--  (id vendor yang lama) untuk dapat id vendor yang baru.
--
--  PENTING: sebelum menjalankan ini di database production sungguhan,
--  export dulu data lewat tombol Ekspor di aplikasi (store.exportAll())
--  dan simpan file JSON-nya di luar repo sebagai cadangan manual.
--  Kolom wedding_data.budget/vendors/seserahan/mahar TIDAK disentuh
--  oleh script ini (cuma dibaca, tidak pernah di-update/delete).
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  1) vendors — HARUS lebih dulu (dipakai resolve vendorId di budget)
-- ─────────────────────────────────────────────────────────────
insert into public.vendors (
  owner_user_id, legacy_id, nama, alamat, hp, email, website, category,
  harga, deskripsi, "tipeHarga", "hargaPax", "paxPengali", "paxManualVal", jadi
)
select
  wd.user_id,
  (v->>'id')::int,
  coalesce(v->>'nama', ''),
  coalesce(v->>'alamat', ''),
  coalesce(v->>'hp', ''),
  coalesce(v->>'email', ''),
  coalesce(v->>'website', ''),
  coalesce(v->>'category', ''),
  coalesce((v->>'harga')::numeric, 0),
  coalesce(v->>'deskripsi', ''),
  coalesce(v->>'tipeHarga', 'paket'),
  coalesce((v->>'hargaPax')::numeric, 0),
  coalesce(v->>'paxPengali', 'orang'),
  coalesce((v->>'paxManualVal')::int, 1),
  coalesce((v->>'jadi')::boolean, false)
from public.wedding_data wd, jsonb_array_elements(wd.vendors) v
where not exists (
  select 1 from public.vendors x
   where x.owner_user_id = wd.user_id and x.legacy_id = (v->>'id')::int
);


-- ─────────────────────────────────────────────────────────────
--  2) budget_items — originType di-derive dari skema lama, vendorId
--     di-resolve lewat legacy_id vendor yang baru saja di-backfill
-- ─────────────────────────────────────────────────────────────
insert into public.budget_items (
  owner_user_id, legacy_id, item, estimasi, aktual, "uangMuka", dibayar,
  "jatuhTempo", remarks, "vendorId", "originType"
)
select
  wd.user_id,
  b->>'id',
  coalesce(b->>'item', ''),
  coalesce((b->>'estimasi')::numeric, 0),
  coalesce((b->>'aktual')::numeric, 0),
  coalesce((b->>'uangMuka')::numeric, 0),
  coalesce((b->>'dibayar')::numeric, 0),
  nullif(b->>'jatuhTempo', '')::date,
  coalesce(b->>'remarks', ''),
  vend.id,
  case
    when nullif(b->>'vendorId', '') is not null then 'vendor'
    when b->>'id' = 'seserahan_auto' or b->>'item' = 'Total Seserahan' then 'seserahan_auto'
    when b->>'id' = 'mahar_auto'      or b->>'item' = 'Total Mahar'      then 'mahar_auto'
    when coalesce((b->>'template')::boolean, false) then 'template'
    else 'manual'
  end
from public.wedding_data wd
join lateral jsonb_array_elements(wd.budget) b on true
left join public.vendors vend
  on vend.owner_user_id = wd.user_id
 and vend.legacy_id = nullif(b->>'vendorId', '')::int
where not exists (
  select 1 from public.budget_items x
   where x.owner_user_id = wd.user_id and x.legacy_id = (b->>'id')
);


-- ─────────────────────────────────────────────────────────────
--  3) seserahan_items
-- ─────────────────────────────────────────────────────────────
insert into public.seserahan_items (owner_user_id, legacy_id, item, status, budget, harga, link)
select
  wd.user_id,
  (s->>'id')::bigint,
  coalesce(s->>'item', ''),
  coalesce((s->>'status')::boolean, false),
  coalesce((s->>'budget')::numeric, 0),
  coalesce((s->>'harga')::numeric, 0),
  coalesce(s->>'link', '')
from public.wedding_data wd, jsonb_array_elements(wd.seserahan) s
where not exists (
  select 1 from public.seserahan_items x
   where x.owner_user_id = wd.user_id and x.legacy_id = (s->>'id')::bigint
);


-- ─────────────────────────────────────────────────────────────
--  4) mahar_items
-- ─────────────────────────────────────────────────────────────
insert into public.mahar_items (owner_user_id, legacy_id, item, status, harga)
select
  wd.user_id,
  (m->>'id')::bigint,
  coalesce(m->>'item', ''),
  coalesce((m->>'status')::boolean, false),
  coalesce((m->>'harga')::numeric, 0)
from public.wedding_data wd, jsonb_array_elements(wd.mahar) m
where not exists (
  select 1 from public.mahar_items x
   where x.owner_user_id = wd.user_id and x.legacy_id = (m->>'id')::bigint
);
