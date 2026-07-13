-- ============================================================
--  015_wave3_rls.sql — RLS untuk admin_groups, admin_items,
--  checklist_groups, checklist_items. Jalankan setelah 014_wave3_schema.sql.
--  Pola identik db/011_wave2_rls.sql — owner dan partner akses simetris
--  lewat EXISTS ke wedding_data (tabel ini nggak punya partner_user_id
--  sendiri). owner_user_id di-denormalisasi ke SEMUA 4 tabel (termasuk
--  tabel item) jadi RLS-nya nggak perlu join ke tabel grup induk.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  admin_groups
-- ─────────────────────────────────────────────────────────────
alter table public.admin_groups enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'admin_groups'
  loop
    execute format('drop policy %I on public.admin_groups', r.policyname);
  end loop;
end $$;

create policy admin_groups_select on public.admin_groups
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy admin_groups_insert on public.admin_groups
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy admin_groups_update on public.admin_groups
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy admin_groups_delete on public.admin_groups
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
--  admin_items
-- ─────────────────────────────────────────────────────────────
alter table public.admin_items enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'admin_items'
  loop
    execute format('drop policy %I on public.admin_items', r.policyname);
  end loop;
end $$;

create policy admin_items_select on public.admin_items
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy admin_items_insert on public.admin_items
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy admin_items_update on public.admin_items
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy admin_items_delete on public.admin_items
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
--  checklist_groups
-- ─────────────────────────────────────────────────────────────
alter table public.checklist_groups enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'checklist_groups'
  loop
    execute format('drop policy %I on public.checklist_groups', r.policyname);
  end loop;
end $$;

create policy checklist_groups_select on public.checklist_groups
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy checklist_groups_insert on public.checklist_groups
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy checklist_groups_update on public.checklist_groups
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy checklist_groups_delete on public.checklist_groups
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
--  checklist_items
-- ─────────────────────────────────────────────────────────────
alter table public.checklist_items enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'checklist_items'
  loop
    execute format('drop policy %I on public.checklist_items', r.policyname);
  end loop;
end $$;

create policy checklist_items_select on public.checklist_items
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy checklist_items_insert on public.checklist_items
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy checklist_items_update on public.checklist_items
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy checklist_items_delete on public.checklist_items
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );
