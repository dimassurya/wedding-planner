-- ============================================================
--  005_wave1_rls.sql — RLS untuk guests + timeline_tasks
--  Jalankan setelah 004_wave1_schema.sql. Idempoten: policy lama
--  dibersihkan dulu, lalu dibuat ulang.
--
--  Tabel ini tidak punya kolom partner_user_id sendiri (beda dari
--  wedding_data) — akses partner dicek lewat EXISTS ke wedding_data,
--  yang tetap jadi sumber kebenaran siapa owner & siapa partnernya.
--  Owner dan partner dapat akses simetris (select/insert/update/delete
--  penuh) — ini BUKAN kapabilitas baru: hari ini partner sudah bisa
--  menulis ulang seluruh kolom guests/timeline lewat wd_update_partner
--  di wedding_data, jadi CRUD per-baris di sini setara, bukan lebih
--  longgar dari yang sudah ada.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  guests
-- ─────────────────────────────────────────────────────────────
alter table public.guests enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'guests'
  loop
    execute format('drop policy %I on public.guests', r.policyname);
  end loop;
end $$;

create policy guests_select on public.guests
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy guests_insert on public.guests
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy guests_update on public.guests
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy guests_delete on public.guests
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
--  timeline_tasks
-- ─────────────────────────────────────────────────────────────
alter table public.timeline_tasks enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'timeline_tasks'
  loop
    execute format('drop policy %I on public.timeline_tasks', r.policyname);
  end loop;
end $$;

create policy timeline_tasks_select on public.timeline_tasks
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy timeline_tasks_insert on public.timeline_tasks
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy timeline_tasks_update on public.timeline_tasks
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy timeline_tasks_delete on public.timeline_tasks
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );
