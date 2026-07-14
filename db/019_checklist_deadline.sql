-- ============================================================
--  019_checklist_deadline.sql — tambah kolom deadline (opsional) ke
--  checklist_items. Dipakai tab Agenda (pengganti Timeline) buat naruh
--  tugas checklist ke garis waktu. Nullable — tugas tanpa deadline nggak
--  muncul di Agenda, tetap tampil normal di Checklist.
--
--  Aman & non-destruktif: cuma nambah 1 kolom nullable, nggak nyentuh data
--  yang ada. checklist_items sudah replica identity full (017), jadi kolom
--  baru otomatis ikut ke payload realtime tanpa perubahan lain.
-- ============================================================

alter table public.checklist_items add column if not exists deadline date;
