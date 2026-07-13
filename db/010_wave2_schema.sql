-- ============================================================
--  010_wave2_schema.sql — Wave 2 migrasi normalisasi: budget, vendors,
--  seserahan, mahar. Lanjutan dari Wave 1 (guests, timeline).
--
--  Keempat entity ini dimigrasi bareng (bukan satu-satu) karena saling
--  terkait: seserahan/mahar nyinkron otomatis ke budget (baris "Total
--  Seserahan"/"Total Mahar"), dan budget."vendorId" adalah FK ke vendors.
--
--  Jalankan urutan: 010_wave2_schema.sql -> 011_wave2_rls.sql ->
--  012_wave2_backfill.sql -> 013_wave2_realtime.sql.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  vendors
-- ─────────────────────────────────────────────────────────────
create table if not exists public.vendors (
  id              bigint generated always as identity primary key,
  owner_user_id   uuid not null references auth.users(id) on delete cascade,
  legacy_id       integer,          -- id lama (max+1 based), cuma buat audit/backfill
  nama            text not null default '',
  alamat          text not null default '',
  hp              text not null default '',
  email           text not null default '',
  website         text not null default '',
  category        text not null default '',
  harga           numeric not null default 0,
  deskripsi       text not null default '',
  "tipeHarga"     text not null default 'paket',
  "hargaPax"      numeric not null default 0,
  "paxPengali"    text not null default 'orang',
  "paxManualVal"  integer not null default 1,
  jadi            boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists vendors_owner_idx on public.vendors (owner_user_id);

drop trigger if exists trg_vendors_touch on public.vendors;
create trigger trg_vendors_touch
  before update on public.vendors
  for each row execute function public.touch_updated_at();


-- ─────────────────────────────────────────────────────────────
--  budget_items
--
--  "originType" gantiin skema lama yang overload kolom id jadi sentinel
--  string ('seserahan_auto'/'mahar_auto') buat nandain baris mirror
--  otomatis. Sekarang id selalu numerik asli dari server, asal baris
--  ditandai eksplisit di kolom ini. vendorId tetap jadi penanda utama
--  baris asal-vendor (originType='vendor' cuma buat konsistensi/query).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.budget_items (
  id              bigint generated always as identity primary key,
  owner_user_id   uuid not null references auth.users(id) on delete cascade,
  legacy_id       text,             -- dulu numerik ATAU 'seserahan_auto'/'mahar_auto', jadi text
  item            text not null default '',
  estimasi        numeric not null default 0,
  aktual          numeric not null default 0,
  "uangMuka"      numeric not null default 0,
  dibayar         numeric not null default 0,
  "jatuhTempo"    date,
  remarks         text not null default '',
  "vendorId"      bigint references public.vendors(id) on delete set null,
  "originType"    text not null default 'manual'
                    check ("originType" in ('manual', 'vendor', 'seserahan_auto', 'mahar_auto', 'template')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists budget_items_owner_idx on public.budget_items (owner_user_id);
create index if not exists budget_items_vendor_idx on public.budget_items ("vendorId");

-- Maksimal 1 baris mirror per owner per jenis — mengunci invariant yang
-- selama ini cuma dijaga di level app (syncSeserahanToBudget/syncMaharToBudget
-- cari-lalu-update-atau-insert, tanpa lock — 2 device toggle hampir
-- bersamaan bisa lolos race tanpa index ini).
create unique index if not exists budget_items_seserahan_auto_uniq
  on public.budget_items (owner_user_id) where "originType" = 'seserahan_auto';
create unique index if not exists budget_items_mahar_auto_uniq
  on public.budget_items (owner_user_id) where "originType" = 'mahar_auto';

drop trigger if exists trg_budget_items_touch on public.budget_items;
create trigger trg_budget_items_touch
  before update on public.budget_items
  for each row execute function public.touch_updated_at();


-- ─────────────────────────────────────────────────────────────
--  seserahan_items
-- ─────────────────────────────────────────────────────────────
create table if not exists public.seserahan_items (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id     bigint,           -- dulu Date.now(), jadi bigint (bukan integer)
  item          text not null default '',
  status        boolean not null default false,
  budget        numeric not null default 0,
  harga         numeric not null default 0,
  link          text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists seserahan_items_owner_idx on public.seserahan_items (owner_user_id);

drop trigger if exists trg_seserahan_items_touch on public.seserahan_items;
create trigger trg_seserahan_items_touch
  before update on public.seserahan_items
  for each row execute function public.touch_updated_at();


-- ─────────────────────────────────────────────────────────────
--  mahar_items
-- ─────────────────────────────────────────────────────────────
create table if not exists public.mahar_items (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id     bigint,           -- dulu Date.now(), jadi bigint
  item          text not null default '',
  status        boolean not null default false,
  harga         numeric not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists mahar_items_owner_idx on public.mahar_items (owner_user_id);

drop trigger if exists trg_mahar_items_touch on public.mahar_items;
create trigger trg_mahar_items_touch
  before update on public.mahar_items
  for each row execute function public.touch_updated_at();
