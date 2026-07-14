-- ============================================================
--  018_rls_perf_optimize.sql — optimasi performa RLS untuk skala besar.
--
--  MASALAH: semua policy sebelumnya (002/005/011/015) memanggil auth.uid()
--  LANGSUNG. Postgres memperlakukan itu sebagai fungsi volatile yang
--  dievaluasi ULANG PER BARIS. Untuk user dengan ratusan baris (tamu +
--  budget + checklist item dst), ini bikin tiap query jauh lebih berat
--  dari yang perlu.
--
--  FIX: bungkus jadi (select auth.uid()). Postgres lalu meng-hoist-nya
--  jadi InitPlan — dievaluasi SEKALI per query, bukan per baris. Ini pola
--  resmi yang disarankan Supabase (RLS performance). Hasil kebijakan
--  identik secara semantik, cuma jauh lebih cepat.
--
--  Idempoten & aman diulang: tiap tabel policy lama dibersihkan dulu,
--  lalu dibuat ulang. TIDAK menyentuh data sama sekali — cuma definisi
--  policy. Tabel & kolom tidak berubah.
--
--  Setelah file ini, 002/005/011/015 jadi "usang" (versi lama pola yang
--  sama) — kalau memasang app di project Supabase baru, cukup jalankan
--  002/005/011/015 dulu lalu 018 di akhir (atau anggap 018 sebagai
--  pengganti final semua policy). Struktur sengaja eksplisit per-tabel
--  (bukan loop dinamis) biar gampang diverifikasi mata untuk DB produksi.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  profiles
-- ─────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;
end $$;

create policy profiles_select_own on public.profiles
  for select using ( id = (select auth.uid()) );
-- (Tetap tidak ada policy UPDATE untuk client — paid_at hanya boleh
--  diisi lewat service_role di backend. Lihat 002_rls_policies.sql.)


-- ─────────────────────────────────────────────────────────────
--  wedding_data
-- ─────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'wedding_data'
  loop
    execute format('drop policy %I on public.wedding_data', r.policyname);
  end loop;
end $$;

create policy wd_select on public.wedding_data
  for select using (
    user_id = (select auth.uid()) or partner_user_id = (select auth.uid())
  );

create policy wd_insert on public.wedding_data
  for insert with check ( user_id = (select auth.uid()) );

create policy wd_update_owner on public.wedding_data
  for update using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

create policy wd_update_partner on public.wedding_data
  for update using ( partner_user_id = (select auth.uid()) )
  with check ( partner_user_id = (select auth.uid()) );

create policy wd_delete on public.wedding_data
  for delete using ( user_id = (select auth.uid()) );


-- ─────────────────────────────────────────────────────────────
--  partner_invitations
-- ─────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'partner_invitations'
  loop
    execute format('drop policy %I on public.partner_invitations', r.policyname);
  end loop;
end $$;

create policy pi_select on public.partner_invitations
  for select using ( owner_user_id = (select auth.uid()) );

create policy pi_insert on public.partner_invitations
  for insert with check ( owner_user_id = (select auth.uid()) );

create policy pi_update on public.partner_invitations
  for update using ( owner_user_id = (select auth.uid()) )
  with check ( owner_user_id = (select auth.uid()) );


-- ─────────────────────────────────────────────────────────────
--  guests
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy guests_insert on public.guests
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy guests_update on public.guests
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy guests_delete on public.guests
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = guests.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  timeline_tasks
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy timeline_tasks_insert on public.timeline_tasks
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy timeline_tasks_update on public.timeline_tasks
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy timeline_tasks_delete on public.timeline_tasks
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = timeline_tasks.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  vendors
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy vendors_insert on public.vendors
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy vendors_update on public.vendors
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy vendors_delete on public.vendors
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = vendors.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  budget_items
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy budget_items_insert on public.budget_items
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy budget_items_update on public.budget_items
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy budget_items_delete on public.budget_items
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = budget_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  seserahan_items
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy seserahan_items_insert on public.seserahan_items
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy seserahan_items_update on public.seserahan_items
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy seserahan_items_delete on public.seserahan_items
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = seserahan_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  mahar_items
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy mahar_items_insert on public.mahar_items
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy mahar_items_update on public.mahar_items
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy mahar_items_delete on public.mahar_items
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = mahar_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  admin_groups
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy admin_groups_insert on public.admin_groups
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy admin_groups_update on public.admin_groups
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy admin_groups_delete on public.admin_groups
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  admin_items
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy admin_items_insert on public.admin_items
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy admin_items_update on public.admin_items
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy admin_items_delete on public.admin_items
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = admin_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  checklist_groups
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy checklist_groups_insert on public.checklist_groups
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy checklist_groups_update on public.checklist_groups
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy checklist_groups_delete on public.checklist_groups
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_groups.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );


-- ─────────────────────────────────────────────────────────────
--  checklist_items
-- ─────────────────────────────────────────────────────────────
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
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy checklist_items_insert on public.checklist_items
  for insert with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy checklist_items_update on public.checklist_items
  for update using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  )
  with check (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );

create policy checklist_items_delete on public.checklist_items
  for delete using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.wedding_data wd
       where wd.user_id = checklist_items.owner_user_id and wd.partner_user_id = (select auth.uid())
    )
  );
