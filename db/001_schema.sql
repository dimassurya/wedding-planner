-- ============================================================
--  001_schema.sql — Skema tabel inti Wedding Planner
--  Jalankan urutan: 001_schema.sql → 002_rls_policies.sql → 003_functions.sql
--  Aman dijalankan berulang (idempoten dgn if not exists / or replace).
-- ============================================================

create extension if not exists pgcrypto;


-- ─────────────────────────────────────────────────────────────
--  profiles — 1 baris per user, dibuat otomatis saat signup
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  paid_at    timestamptz,
  created_at timestamptz not null default now()
);

-- Auto-provision profil setiap ada user baru di auth.users.
-- Tanpa ini, loadProfile() di client (pakai .single()) akan error
-- keras saat login pertama kali karena barisnya belum ada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
--  wedding_data — 1 baris per owner, kolom JSONB per fitur
-- ─────────────────────────────────────────────────────────────
create table if not exists public.wedding_data (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  partner_user_id uuid references auth.users(id) on delete set null,
  partner_email   text,
  guests          jsonb not null default '[]'::jsonb,
  budget          jsonb not null default '[]'::jsonb,
  vendors         jsonb not null default '[]'::jsonb,
  seserahan       jsonb not null default '[]'::jsonb,
  mahar           jsonb not null default '[]'::jsonb,
  admin           jsonb not null default '[]'::jsonb,
  checklist       jsonb not null default '[]'::jsonb,
  timeline        jsonb not null default '[]'::jsonb,
  settings        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists wedding_data_partner_user_id_idx on public.wedding_data (partner_user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wedding_data_touch on public.wedding_data;
create trigger trg_wedding_data_touch
  before update on public.wedding_data
  for each row execute function public.touch_updated_at();


-- ─────────────────────────────────────────────────────────────
--  partner_invitations — token undangan dashboard bersama
-- ─────────────────────────────────────────────────────────────
create table if not exists public.partner_invitations (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  partner_email text not null,
  token         text not null unique default encode(gen_random_bytes(24), 'hex'),
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '7 days')
);

create index if not exists partner_invitations_owner_idx on public.partner_invitations (owner_user_id);
create index if not exists partner_invitations_token_idx on public.partner_invitations (token);
