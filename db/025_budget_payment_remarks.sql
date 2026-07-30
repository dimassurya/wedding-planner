-- Catatan khusus tiap termin/pembayaran. Terpisah dari catatan umum vendor
-- maupun catatan item Budget agar konteks transfer tidak tercampur.
alter table public.budget_payments
  add column if not exists remarks text not null default '';
