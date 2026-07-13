-- ============================================================
--  007_fix_accept_invite_token_type.sql
--
--  Khusus buat project Supabase ini: tabel partner_invitations di sini
--  ternyata sudah ada SEBELUM 001_schema.sql pernah dijalankan (dibuat
--  di setup yang lebih awal) — jadi "create table if not exists" di
--  001_schema.sql cuma no-op, tidak pernah membuat ulang tabelnya. Kolom
--  aslinya: id uuid, token uuid — BUKAN bigint/text seperti yang
--  diasumsikan 001_schema.sql/003_functions.sql.
--
--  Akibatnya accept_partner_invite(invite_token text, ...) gagal dengan
--  "operator does not exist: uuid = text" karena parameter text
--  dibandingkan langsung ke kolom token yang uuid.
--
--  Fix: ganti tipe parameter invite_token jadi uuid, samakan dgn tipe
--  kolom aslinya. TIDAK perlu ubah kode client sama sekali — token
--  cuma diperlakukan sebagai string biasa di JS, PostgREST otomatis
--  cast ke uuid sesuai signature fungsi ini.
--
--  Aman dijalankan berulang.
-- ============================================================

drop function if exists public.accept_partner_invite(text, text);

create or replace function public.accept_partner_invite(
  invite_token     uuid,
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

revoke all on function public.accept_partner_invite(uuid, text) from public;
grant execute on function public.accept_partner_invite(uuid, text) to authenticated;
