-- ============================================================
--  020_payment_trial.sql — trial 2 hari + tracking pembayaran iPaymu.
--  Jalankan setelah 001-003. Idempoten (create if not exists / or replace).
--
--  Alur besar:
--  1. User selesai onboarding → client panggil RPC start_trial() →
--     profiles.trial_ends_at = now() + 2 hari (SEKALI, tak bisa direset
--     ulang dari client — lihat guard "where trial_ends_at is null").
--  2. Selama trial aktif ATAU sudah bayar (paid_at terisi), app.vue
--     kasih akses penuh. Begitu trial habis & belum bayar, dikunci
--     balik ke PaymentPage (lihat store.hasAccess).
--  3. "Bayar Sekarang" di PaymentPage manggil edge function
--     create-payment → insert baris payments (status pending) →
--     tampilkan QRIS. iPaymu callback ke edge function ipaymu-webhook,
--     yang verifikasi ulang status LANGSUNG ke iPaymu (bukan percaya
--     body webhook mentah), lalu set payments.status + profiles.paid_at
--     pakai service_role (bypass RLS — sama seperti pola paid_at yang
--     sudah didokumentasikan di 002_rls_policies.sql).
-- ============================================================


-- ─────────────────────────────────────────────────────────────
--  profiles.trial_ends_at
-- ─────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists trial_ends_at timestamptz;

-- start_trial — dipanggil client (completeOnboarding di wedding.js).
-- security definer karena profiles TIDAK punya policy UPDATE untuk client
-- biasa (sengaja, sama alasannya kayak paid_at — biar user nggak bisa
-- reset/perpanjang trial sendiri lewat update langsung). Guard
-- "trial_ends_at is null" bikin RPC ini cuma bisa "mulai" trial SEKALI;
-- panggilan berikutnya jadi no-op.
create or replace function public.start_trial()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set trial_ends_at = now() + interval '2 days'
   where id = auth.uid()
     and trial_ends_at is null;
end;
$$;

revoke all on function public.start_trial() from public;
grant execute on function public.start_trial() to authenticated;


-- ─────────────────────────────────────────────────────────────
--  payments — audit trail transaksi iPaymu, dipakai juga buat idempotency
--  webhook (trx_id unik — cegah event yang sama diproses dobel).
--  Tidak ada policy insert/update untuk client — hanya edge function
--  (pakai service_role, otomatis bypass RLS) yang menulis ke sini.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id            bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  trx_id        text not null unique,
  reference_id  text not null,
  amount        numeric not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'paid', 'failed', 'expired')),
  method        text,
  raw_payload   jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists payments_owner_idx on public.payments (owner_user_id);

drop trigger if exists trg_payments_touch on public.payments;
create trigger trg_payments_touch
  before update on public.payments
  for each row execute function public.touch_updated_at();

alter table public.payments enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'payments'
  loop
    execute format('drop policy %I on public.payments', r.policyname);
  end loop;
end $$;

-- Owner cuma boleh BACA riwayat pembayarannya sendiri (mis. buat nampilin
-- "Rp99.000 - Lunas" di halaman akun). Insert/update SENGAJA tidak ada
-- policy untuk client — cuma edge function (service_role) yang menulis.
create policy payments_select_own on public.payments
  for select using ( owner_user_id = (select auth.uid()) );
