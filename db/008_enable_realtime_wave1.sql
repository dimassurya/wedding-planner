-- ============================================================
--  008_enable_realtime_wave1.sql — daftarkan guests & timeline_tasks
--  ke publication realtime Supabase.
--
--  Bikin tabel baru TIDAK otomatis membuatnya ikut disiarkan lewat
--  postgres_changes — harus didaftarkan eksplisit ke publication
--  `supabase_realtime`. Tabel wedding_data bisa realtime sebelumnya
--  karena itu diaktifkan manual lewat toggle di Dashboard (Database →
--  Replication) di sesi yang jauh lebih awal, bukan lewat SQL — jadi
--  gampang kelewat kalau bikin tabel baru lewat SQL Editor.
--
--  Aman dijalankan berulang (cek dulu sebelum nambah, tidak error kalau
--  sudah terdaftar).
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'guests'
  ) then
    execute 'alter publication supabase_realtime add table public.guests';
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'timeline_tasks'
  ) then
    execute 'alter publication supabase_realtime add table public.timeline_tasks';
  end if;
end $$;

-- Verifikasi: query ini harus menampilkan 3 baris (wedding_data yang
-- lama + 2 tabel baru) setelah script di atas berhasil.
-- select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public';
