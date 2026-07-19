-- Ganti opsi kehadiran "virtual" jadi "hampers" (kirim hampers, bukan hadir virtual).
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conrelid = 'public.guests'::regclass and conname = 'guests_kehadiran_check'
  ) then
    alter table public.guests drop constraint guests_kehadiran_check;
  end if;
end $$;

update public.guests set kehadiran = 'hampers' where kehadiran = 'virtual';

alter table public.guests add constraint guests_kehadiran_check
  check (kehadiran in ('belum', 'hadir', 'tidak', 'hampers'));
