create table if not exists public.order_records (
  id text primary key,
  data jsonb not null,
  updated_at bigint not null
);

alter table public.order_records enable row level security;

create policy "authenticated users can read shared orders"
on public.order_records for select
to authenticated
using (true);

create policy "authenticated users can create shared orders"
on public.order_records for insert
to authenticated
with check (true);

create policy "authenticated users can update shared orders"
on public.order_records for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can delete shared orders"
on public.order_records for delete
to authenticated
using (true);

create index if not exists idx_order_records_updated_at
on public.order_records(updated_at desc);
