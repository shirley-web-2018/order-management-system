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

-- Private storage for contract and invoice attachments.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-documents',
  'order-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated users can read order documents" on storage.objects;
create policy "authenticated users can read order documents"
on storage.objects for select to authenticated
using (bucket_id = 'order-documents');

drop policy if exists "authenticated users can upload order documents" on storage.objects;
create policy "authenticated users can upload order documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'order-documents');

drop policy if exists "authenticated users can delete order documents" on storage.objects;
create policy "authenticated users can delete order documents"
on storage.objects for delete to authenticated
using (bucket_id = 'order-documents');
