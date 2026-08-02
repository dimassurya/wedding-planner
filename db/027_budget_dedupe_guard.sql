-- ============================================================
--  027_budget_dedupe_guard.sql — bersihkan & cegah baris budget dobel.
--
--  KEJADIAN NYATA (2026-08-02): baris budget_items tiba-tiba terduplikat
--  selagi user mengisi data. Akar masalahnya di client: _diffAndSync
--  (wedding.js) tidak punya penjaga tumpang-tindih — baris baru (mirror
--  vendor→Budget / mahar-seserahan→Budget / termin pembayaran) hidup
--  tanpa id sampai INSERT-nya balik dari server, dan kalau run sync kedua
--  keburu mulai selagi INSERT pertama masih di jalan, baris yang sama
--  ke-INSERT dua kali. Client sudah diperbaiki (antrean per kolom +
--  penanda insert-in-flight); file ini yang beresin sisi database:
--
--   BAGIAN A — hapus duplikat mirror yang sudah terlanjur ada (termin
--              pembayarannya dipindah dulu ke baris yang dipertahankan).
--   BAGIAN B — unique index supaya duplikat mirror MUSTAHIL kejadian
--              lagi, apapun bug client di masa depan.
--
--  Aman dijalankan ulang (idempoten). Baris yang dipertahankan = id
--  TERKECIL (paling awal dibuat). Cache "dibayar"/"jatuhTempo" pada baris
--  yang dipertahankan tidak perlu dikoreksi manual — app menghitung ulang
--  dari budget_payments setiap kali load (_reconcileAllDibayar).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
--  BAGIAN A1: duplikat mirror VENDOR (vendorId sama, owner sama)
-- ─────────────────────────────────────────────────────────────

-- Pindahkan termin pembayaran dari baris duplikat ke baris asli.
with dupes as (
  select b.id as dup_id,
         min(b.id) over (partition by b.owner_user_id, b."vendorId") as keep_id
  from public.budget_items b
  where b."vendorId" is not null
)
update public.budget_payments p
set "budgetItemId" = d.keep_id
from dupes d
where p."budgetItemId" = d.dup_id and d.dup_id <> d.keep_id;

with dupes as (
  select b.id as dup_id,
         min(b.id) over (partition by b.owner_user_id, b."vendorId") as keep_id
  from public.budget_items b
  where b."vendorId" is not null
)
delete from public.budget_items b
using dupes d
where b.id = d.dup_id and d.dup_id <> d.keep_id;

-- ─────────────────────────────────────────────────────────────
--  BAGIAN A2: duplikat mirror MAHAR & SESERAHAN (weddingGiftId sama)
-- ─────────────────────────────────────────────────────────────

with dupes as (
  select b.id as dup_id,
         min(b.id) over (partition by b.owner_user_id, b."weddingGiftId") as keep_id
  from public.budget_items b
  where b."weddingGiftId" is not null
)
update public.budget_payments p
set "budgetItemId" = d.keep_id
from dupes d
where p."budgetItemId" = d.dup_id and d.dup_id <> d.keep_id;

with dupes as (
  select b.id as dup_id,
         min(b.id) over (partition by b.owner_user_id, b."weddingGiftId") as keep_id
  from public.budget_items b
  where b."weddingGiftId" is not null
)
delete from public.budget_items b
using dupes d
where b.id = d.dup_id and d.dup_id <> d.keep_id;

-- ─────────────────────────────────────────────────────────────
--  BAGIAN B: kunci permanen — satu baris mirror per vendor / per gift
--  per owner. Kalau bug client mana pun mencoba INSERT kedua, Postgres
--  menolak (23505) dan app menampilkan "data serupa sudah ada" alih-alih
--  diam-diam menggandakan biaya.
-- ─────────────────────────────────────────────────────────────

create unique index if not exists budget_items_vendor_uniq
  on public.budget_items (owner_user_id, "vendorId")
  where "vendorId" is not null;

create unique index if not exists budget_items_gift_uniq
  on public.budget_items (owner_user_id, "weddingGiftId")
  where "weddingGiftId" is not null;

-- ─────────────────────────────────────────────────────────────
--  DIAGNOSTIK (opsional, jalankan manual): duplikat baris budget MANUAL /
--  TEMPLATE (tanpa vendorId/weddingGiftId) tidak bisa dibersihkan otomatis
--  — dua item beda yang kebetulan namanya sama itu sah (bukan bug).
--  Query ini menampilkan kandidat duplikat dari race yang sama: isi persis
--  sama & dibuat dalam rentang 10 menit. Tinjau dulu hasilnya, lalu hapus
--  id yang tidak diinginkan lewat tab Budget di aplikasi (lebih aman
--  daripada DELETE massal di sini).
--
--  select owner_user_id, item, estimasi, aktual,
--         array_agg(id order by id)         as ids,
--         array_agg(created_at order by id) as dibuat
--  from public.budget_items
--  where "vendorId" is null and "weddingGiftId" is null
--  group by owner_user_id, item, estimasi, aktual
--  having count(*) > 1
--     and max(created_at) - min(created_at) < interval '10 minutes';
-- ─────────────────────────────────────────────────────────────
