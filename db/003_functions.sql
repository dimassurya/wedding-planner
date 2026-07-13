-- ============================================================
--  003_functions.sql — RPC yang dipanggil dari src/stores/wedding.js
--  Jalankan setelah 001_schema.sql dan 002_rls_policies.sql.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  expire_old_invitations — tandai undangan pending yang lewat
--  expires_at jadi 'expired'. Postgres tidak punya trigger berbasis
--  waktu murni (trigger cuma bereaksi ke DML), jadi ini dipanggil
--  "lazy" dari dalam accept_partner_invite tiap kali ada percobaan
--  terima undangan. Kalau project ini punya ekstensi pg_cron aktif
--  (Database → Extensions di dashboard Supabase), boleh dijadwalkan
--  juga biar statusnya rapi walau tak ada yang buka link — lihat
--  contoh di paling bawah file ini (dikomentari, opsional).
-- ─────────────────────────────────────────────────────────────
create or replace function public.expire_old_invitations()
returns void
language sql
security definer
set search_path = public
as $$
  update public.partner_invitations
     set status = 'expired'
   where status = 'pending' and expires_at <= now();
$$;

revoke all on function public.expire_old_invitations() from public;
grant execute on function public.expire_old_invitations() to authenticated;


-- ─────────────────────────────────────────────────────────────
--  accept_partner_invite — dipanggil dari acceptPartnerInvite() di
--  wedding.js. Ini fungsi yang SEBELUMNYA TIDAK ADA di manapun di
--  repo (partnership_policies.sql cuma bilang "sudah ada, tidak
--  disentuh" — asumsi itu cuma valid di project Supabase yang sudah
--  jalan lama; di project baru fungsi ini memang belum pernah dibuat).
--
--  security definer karena partner-to-be belum py hak UPDATE row
--  wedding_data milik owner (partner_user_id belum ke-set — itu
--  justru yang mau di-set di sini), jadi butuh privilese elevated.
-- ─────────────────────────────────────────────────────────────
create or replace function public.accept_partner_invite(
  invite_token     text,
  partner_email_in text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  already_paired uuid;
begin
  perform public.expire_old_invitations();

  select * into inv
    from public.partner_invitations
   where token = invite_token
     and status = 'pending'
     and expires_at > now()
   limit 1;

  if inv is null then
    return null;  -- token invalid / sudah dipakai / kedaluwarsa
  end if;

  if inv.owner_user_id = auth.uid() then
    raise exception 'Tidak bisa menerima undangan sendiri';
  end if;

  if lower(inv.partner_email) <> lower(partner_email_in) then
    raise exception 'Email tidak cocok dengan undangan ini';
  end if;

  select partner_user_id into already_paired
    from public.wedding_data
   where user_id = inv.owner_user_id;

  if already_paired is not null then
    raise exception 'Dashboard ini sudah punya pasangan aktif';
  end if;

  update public.wedding_data
     set partner_user_id = auth.uid(),
         partner_email   = partner_email_in
   where user_id = inv.owner_user_id;

  update public.partner_invitations
     set status = 'accepted'
   where id = inv.id;

  return inv.owner_user_id;
end;
$$;

revoke all on function public.accept_partner_invite(text, text) from public;
grant execute on function public.accept_partner_invite(text, text) to authenticated;


-- ─────────────────────────────────────────────────────────────
--  leave_partnership — partner keluar dari dashboard bersama.
--  (Sama seperti sebelumnya di partnership_policies.sql — dipindah
--  ke sini biar semua RPC ngumpul di satu file.)
-- ─────────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────────
--  OPSIONAL — jadwalkan expire_old_invitations tiap hari lewat
--  pg_cron, kalau ekstensinya aktif di project ini. Tidak wajib:
--  accept_partner_invite sudah memanggilnya sendiri tiap ada yang
--  coba terima undangan, jadi fungsional aplikasi tidak bergantung
--  pada cron ini — ini cuma soal kerapian data admin.
-- ─────────────────────────────────────────────────────────────
-- create extension if not exists pg_cron;
-- select cron.schedule(
--   'expire-old-invitations-daily',
--   '0 3 * * *',
--   $$ select public.expire_old_invitations(); $$
-- );
