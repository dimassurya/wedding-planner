-- ============================================================
--  009_fix_delete_realtime.sql — perbaiki event DELETE realtime
--  yang tidak sampai ke device lain
--
--  Supabase Realtime memfilter postgres_changes pakai kolom
--  (mis. owner_user_id=eq.<id>). Untuk INSERT/UPDATE data barunya
--  selalu lengkap semua kolom, jadi filter bisa dicek. Tapi untuk
--  DELETE, Postgres dengan REPLICA IDENTITY DEFAULT (bawaan tabel yang
--  punya primary key) cuma menyertakan kolom PRIMARY KEY di data "row
--  sebelum dihapus" — owner_user_id tidak ikut. Karena filter mencari
--  owner_user_id yang tidak ada di payload, event DELETE gagal cocok
--  dgn filter dan tidak pernah dikirim ke subscriber lain.
--
--  Fix: REPLICA IDENTITY FULL membuat SEMUA kolom (termasuk
--  owner_user_id) ikut disertakan di data "old" untuk UPDATE & DELETE,
--  jadi filter bisa dievaluasi dengan benar.
--
--  Aman dijalankan berulang.
-- ============================================================

alter table public.guests         replica identity full;
alter table public.timeline_tasks replica identity full;
