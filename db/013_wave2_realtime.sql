-- ============================================================
--  013_wave2_realtime.sql — daftarkan vendors/budget_items/
--  seserahan_items/mahar_items ke publication realtime + replica
--  identity full. Jalankan setelah 012_wave2_backfill.sql.
--
--  Ini 2 dari 3 hal wajib per tabel baru (yang ketiga, RLS, sudah di
--  011_wave2_rls.sql) — pelajaran dari Wave 1 yang sempat ketemu 2 bug
--  terpisah karena ini kelewat: tabel baru TIDAK otomatis ikut
--  disiarkan realtime (harus didaftarkan ke publication), dan tanpa
--  REPLICA IDENTITY FULL, event DELETE cuma bawa kolom primary key di
--  data lama sehingga gagal cocok dengan filter owner_user_id=eq...
--  (INSERT/UPDATE tidak kena masalah ini karena data barunya selalu
--  lengkap semua kolom).
--
--  Aman dijalankan berulang.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vendors'
  ) then
    execute 'alter publication supabase_realtime add table public.vendors';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'budget_items'
  ) then
    execute 'alter publication supabase_realtime add table public.budget_items';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'seserahan_items'
  ) then
    execute 'alter publication supabase_realtime add table public.seserahan_items';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mahar_items'
  ) then
    execute 'alter publication supabase_realtime add table public.mahar_items';
  end if;
end $$;

alter table public.vendors         replica identity full;
alter table public.budget_items    replica identity full;
alter table public.seserahan_items replica identity full;
alter table public.mahar_items     replica identity full;

-- Verifikasi: query ini harus menampilkan wedding_data + guests +
-- timeline_tasks (dari Wave 1) + 4 tabel baru di atas = 7 baris.
-- select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public';
