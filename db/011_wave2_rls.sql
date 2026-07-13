-- ============================================================
--  011_wave2_rls.sql — RLS untuk vendors, budget_items,
--  seserahan_items, mahar_items. Jalankan setelah 010_wave2_schema.sql.
--  Pola identik db/005_wave1_rls.sql — owner dan partner akses simetris
--  (owner_user_id=auth.uid() ATAU EXISTS partner_user_id di wedding_data),
--  karena tabel ini tidak punya kolom partner_user_id sendiri.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  vendors
-- ─────────────────────────────────────────────────────────────
alter table public.vendors enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'vendors'
  loop
    execute format('drop policy %I on public.vendors', r.policyname);
  end loop;
end $$;

create policy vendors_select on public.vendors
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy vendors_insert on public.vendors
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy vendors_update on public.vendors
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy vendors_delete on public.vendors
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
--  budget_items
-- ─────────────────────────────────────────────────────────────
alter table public.budget_items enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'budget_items'
  loop
    execute format('drop policy %I on public.budget_items', r.policyname);
  end loop;
end $$;

create policy budget_items_select on public.budget_items
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy budget_items_insert on public.budget_items
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy budget_items_update on public.budget_items
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy budget_items_delete on public.budget_items
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
--  seserahan_items
-- ─────────────────────────────────────────────────────────────
alter table public.seserahan_items enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'seserahan_items'
  loop
    execute format('drop policy %I on public.seserahan_items', r.policyname);
  end loop;
end $$;

create policy seserahan_items_select on public.seserahan_items
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy seserahan_items_insert on public.seserahan_items
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy seserahan_items_update on public.seserahan_items
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy seserahan_items_delete on public.seserahan_items
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
--  mahar_items
-- ─────────────────────────────────────────────────────────────
alter table public.mahar_items enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'mahar_items'
  loop
    execute format('drop policy %I on public.mahar_items', r.policyname);
  end loop;
end $$;

create policy mahar_items_select on public.mahar_items
  for select using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy mahar_items_insert on public.mahar_items
  for insert with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy mahar_items_update on public.mahar_items
  for update using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  )
  with check (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );

create policy mahar_items_delete on public.mahar_items
  for delete using (
    owner_user_id = auth.uid()
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = auth.uid()
    )
  );
