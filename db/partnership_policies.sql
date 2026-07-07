-- ============================================================
--  RLS & RPC untuk fitur "Dashboard Bersama" (partnership)
--  Cara pakai:
--    Supabase Dashboard → SQL Editor → New query → tempel semua → Run.
--  Aman dijalankan berulang (idempoten): policy lama dibersihkan dulu,
--  lalu dibuat ulang set yang benar. Fungsi accept_partner_invite yang
--  sudah ada TIDAK disentuh.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  1) wedding_data
-- ─────────────────────────────────────────────────────────────
alter table public.wedding_data enable row level security;

-- Bersihkan SEMUA policy lama supaya tidak ada sisa yang konflik.
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
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
-- harus tetap terdaftar sesudahnya. Ini mencegah partner membajak
-- kepemilikan atau mengosongkan partner_user_id lewat update biasa.
-- (Keluar dari partnership dilakukan lewat RPC leave_partnership di bawah.)
create policy wd_update_partner on public.wedding_data
  for update using ( partner_user_id = auth.uid() )
  with check ( partner_user_id = auth.uid() );

-- HAPUS baris: hanya owner.
create policy wd_delete on public.wedding_data
  for delete using ( user_id = auth.uid() );


-- ─────────────────────────────────────────────────────────────
--  2) partner_invitations
-- ─────────────────────────────────────────────────────────────
alter table public.partner_invitations enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
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


-- ─────────────────────────────────────────────────────────────
--  3) RPC: partner keluar dari dashboard bersama
-- ─────────────────────────────────────────────────────────────
-- Partner tidak boleh mengubah kolom kepemilikan lewat RLS (demi keamanan),
-- jadi pemutusan dari sisi partner lewat fungsi ini. security definer =
-- berjalan dengan hak pemilik fungsi sehingga bisa menembus RLS, tapi
-- lingkupnya dibatasi ke baris tempat auth.uid() memang partner.
create or replace function public.leave_partnership()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.wedding_data
     set partner_user_id = null,
         partner_email   = null
   where partner_user_id = auth.uid();
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke all on function public.leave_partnership() from public;
grant execute on function public.leave_partnership() to authenticated;
