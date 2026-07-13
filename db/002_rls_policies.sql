-- ============================================================
--  002_rls_policies.sql — RLS untuk profiles, wedding_data,
--  partner_invitations. Jalankan setelah 001_schema.sql.
--  Idempoten: policy lama dibersihkan dulu, lalu dibuat ulang.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  profiles
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;
end $$;

-- User cuma boleh baca profilnya sendiri.
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

-- SENGAJA tidak ada policy UPDATE untuk client biasa. paid_at menentukan
-- akses fitur berbayar — kalau user bisa UPDATE barisnya sendiri lewat
-- RLS, mereka bisa unlock paid_at sendiri tanpa bayar. Saat integrasi
-- pembayaran (Stripe dkk) dibuat, set paid_at lewat service_role key di
-- backend/edge function (yang otomatis bypass RLS), bukan dari client.


-- ─────────────────────────────────────────────────────────────
--  wedding_data
-- ─────────────────────────────────────────────────────────────
alter table public.wedding_data enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'wedding_data'
  loop
    execute format('drop policy %I on public.wedding_data', r.policyname);
  end loop;
end $$;

-- BACA: owner ATAU partner yang terdaftar di baris itu.
create policy wd_select on public.wedding_data
  for select using (
    user_id = auth.uid() or partner_user_id = auth.uid()
  );

-- BUAT baris: hanya untuk diri sendiri sebagai owner.
create policy wd_insert on public.wedding_data
  for insert with check ( user_id = auth.uid() );

-- UPDATE oleh owner: bebas atas barisnya sendiri —
-- termasuk melepas pasangan (set partner_user_id = null).
create policy wd_update_owner on public.wedding_data
  for update using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

-- UPDATE oleh partner: hanya baris owner tempat dia terdaftar, DAN dia
-- harus tetap terdaftar sesudahnya. Mencegah partner membajak kepemilikan
-- atau mengosongkan partner_user_id lewat update biasa — keluar dari
-- partnership dilakukan lewat RPC leave_partnership (lihat 003_functions.sql).
create policy wd_update_partner on public.wedding_data
  for update using ( partner_user_id = auth.uid() )
  with check ( partner_user_id = auth.uid() );

-- HAPUS baris: hanya owner.
create policy wd_delete on public.wedding_data
  for delete using ( user_id = auth.uid() );


-- ─────────────────────────────────────────────────────────────
--  partner_invitations
-- ─────────────────────────────────────────────────────────────
alter table public.partner_invitations enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'partner_invitations'
  loop
    execute format('drop policy %I on public.partner_invitations', r.policyname);
  end loop;
end $$;

-- Owner boleh melihat & mengelola undangannya sendiri.
-- (Partner menerima undangan lewat RPC accept_partner_invite yang
--  security-definer, jadi tak perlu akses SELECT langsung ke tabel ini.)
create policy pi_select on public.partner_invitations
  for select using ( owner_user_id = auth.uid() );

create policy pi_insert on public.partner_invitations
  for insert with check ( owner_user_id = auth.uid() );

create policy pi_update on public.partner_invitations
  for update using ( owner_user_id = auth.uid() )
  with check ( owner_user_id = auth.uid() );
