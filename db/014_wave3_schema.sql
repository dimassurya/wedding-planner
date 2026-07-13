-- ============================================================
--  014_wave3_schema.sql — Wave 3 migrasi normalisasi: admin, checklist.
--  Lanjutan Wave 1 (guests, timeline) + Wave 2 (budget, vendors,
--  seserahan, mahar). Ini yang terakhir & paling kompleks — struktur
--  nested (grup berisi array item), beda dari 6 entity sebelumnya yang
--  semua flat.
--
--  Jalankan urutan: 014_wave3_schema.sql -> 015_wave3_rls.sql ->
--  016_wave3_backfill.sql -> 017_wave3_realtime.sql.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  admin_groups / admin_items
--  Tidak ada kolom position — tidak ada fitur reorder buat admin.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.admin_groups (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id     integer,          -- id lama (global ke admin[], bukan ke item)
  grup          text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists admin_groups_owner_idx on public.admin_groups (owner_user_id);

drop trigger if exists trg_admin_groups_touch on public.admin_groups;
create trigger trg_admin_groups_touch
  before update on public.admin_groups
  for each row execute function public.touch_updated_at();

-- on delete cascade: item nggak py keberadaan independen di luar grupnya,
-- hapus grup wajar ikut hapus semua itemnya (beda dari budget_items.vendorId
-- di Wave 2 yang pakai "set null" karena budget row punya arti sendiri).
create table if not exists public.admin_items (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  group_id      bigint not null references public.admin_groups(id) on delete cascade,
  legacy_id     integer,          -- PENTING: id lama ini cuma unik DI DALAM satu
                                  -- grup (restart dari 1 tiap grup) — jangan
                                  -- pernah dipakai buat cek unik lintas grup.
  syarat        text not null default '',
  status        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists admin_items_owner_idx on public.admin_items (owner_user_id);
create index if not exists admin_items_group_idx on public.admin_items (group_id);

drop trigger if exists trg_admin_items_touch on public.admin_items;
create trigger trg_admin_items_touch
  before update on public.admin_items
  for each row execute function public.touch_updated_at();


-- ─────────────────────────────────────────────────────────────
--  checklist_groups / checklist_items
--  checklist_groups py kolom position — drag-reorder fase beneran ada
--  di UI (ChecklistTab.vue onDragEnd).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.checklist_groups (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id     integer,
  fase          text not null default '',
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists checklist_groups_owner_idx on public.checklist_groups (owner_user_id);

drop trigger if exists trg_checklist_groups_touch on public.checklist_groups;
create trigger trg_checklist_groups_touch
  before update on public.checklist_groups
  for each row execute function public.touch_updated_at();

create table if not exists public.checklist_items (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  group_id      bigint not null references public.checklist_groups(id) on delete cascade,
  legacy_id     integer,          -- sama seperti admin_items: cuma unik per grup
  tugas         text not null default '',
  status        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists checklist_items_owner_idx on public.checklist_items (owner_user_id);
create index if not exists checklist_items_group_idx on public.checklist_items (group_id);

drop trigger if exists trg_checklist_items_touch on public.checklist_items;
create trigger trg_checklist_items_touch
  before update on public.checklist_items
  for each row execute function public.touch_updated_at();
