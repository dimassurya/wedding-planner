-- ============================================================
--  004_wave1_schema.sql — Wave 1 migrasi normalisasi: guests + timeline
--
--  Bagian dari migrasi bertahap JSONB-blob (wedding_data.guests /
--  wedding_data.timeline) -> tabel per-baris, supaya realtime sync bisa
--  beroperasi per-baris (bukan replace seluruh array), menghindari dua
--  device saling menimpa perubahan saat edit hampir bersamaan.
--
--  Jalankan urutan: 004_wave1_schema.sql -> 005_wave1_rls.sql ->
--  006_wave1_backfill.sql. Kolom lama wedding_data.guests/timeline
--  SENGAJA tidak dihapus/disentuh — tetap ada sebagai jaring pengaman
--  rollback selama masa observasi.
--
--  PENTING: file ini butuh tabel `wedding_data` (dari 001_schema.sql)
--  sudah ada — dipakai sebagai acuan owner/partner di 005_wave1_rls.sql.
--  Kalau belum pernah dijalankan sama sekali di project Supabase ini,
--  jalankan 001_schema.sql -> 002_rls_policies.sql -> 003_functions.sql
--  dulu sebelum lanjut ke file ini.
-- ============================================================

-- create-or-replace (bukan cuma di 001_schema.sql) supaya file ini tetap
-- bisa jalan sendiri walau 001_schema.sql belum/lupa dijalankan duluan —
-- aman dijalankan ulang berkali-kali, definisinya identik.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.guests (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id     integer,          -- id lama (array-index based), cuma buat audit/backfill
  nama          text not null default '',
  jumlah        integer not null default 1,
  undangan      text not null default 'keduanya',
  status        text not null default 'lainnya',
  konfirmasi    boolean not null default true,
  catatan       text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists guests_owner_idx on public.guests (owner_user_id);

drop trigger if exists trg_guests_touch on public.guests;
create trigger trg_guests_touch
  before update on public.guests
  for each row execute function public.touch_updated_at();  -- reuse fungsi dari 001_schema.sql


-- Catatan: kolom "tanggalSelesai" sengaja quoted camelCase, PERSIS sama
-- dgn nama field di object JS (t.tanggalSelesai). Ini supaya diff engine
-- generik di wedding.js (_diffAndSync) bisa insert/update baris apa adanya
-- tanpa perlu lapisan mapping camelCase<->snake_case per tabel/per kolom.
-- Semua kolom lain kebetulan satu kata jadi tidak masalah tanpa quoting.
create table if not exists public.timeline_tasks (
  id              bigint generated always as identity primary key,
  owner_user_id   uuid not null references auth.users(id) on delete cascade,
  legacy_id       integer,
  tugas           text not null default '',
  deadline        date,
  status          text not null default 'belum',
  pic             text not null default '',
  "tanggalSelesai" date,
  catatan         text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists timeline_tasks_owner_idx on public.timeline_tasks (owner_user_id);

drop trigger if exists trg_timeline_touch on public.timeline_tasks;
create trigger trg_timeline_touch
  before update on public.timeline_tasks
  for each row execute function public.touch_updated_at();
