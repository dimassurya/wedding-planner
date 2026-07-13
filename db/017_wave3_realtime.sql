-- ============================================================
--  017_wave3_realtime.sql — daftarkan admin_groups/admin_items/
--  checklist_groups/checklist_items ke publication realtime + replica
--  identity full. Jalankan setelah 016_wave3_backfill.sql.
--
--  Ini yang terakhir dari 3 hal wajib per tabel baru (RLS di
--  015_wave3_rls.sql). Sama seperti Wave 1/2: tabel baru TIDAK otomatis
--  ikut disiarkan realtime, dan tanpa REPLICA IDENTITY FULL event DELETE
--  cuma bawa kolom primary key di data lama sehingga gagal cocok dengan
--  filter owner_user_id=eq... (INSERT/UPDATE tidak kena masalah ini).
--
--  Aman dijalankan berulang.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_groups'
  ) then
    execute 'alter publication supabase_realtime add table public.admin_groups';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_items'
  ) then
    execute 'alter publication supabase_realtime add table public.admin_items';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'checklist_groups'
  ) then
    execute 'alter publication supabase_realtime add table public.checklist_groups';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'checklist_items'
  ) then
    execute 'alter publication supabase_realtime add table public.checklist_items';
  end if;
end $$;

alter table public.admin_groups     replica identity full;
alter table public.admin_items      replica identity full;
alter table public.checklist_groups replica identity full;
alter table public.checklist_items  replica identity full;

-- Verifikasi: query ini harus menampilkan wedding_data + guests +
-- timeline_tasks + vendors + budget_items + seserahan_items + mahar_items
-- (dari Wave 1/2) + 4 tabel baru di atas = 11 baris.
-- select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public';
