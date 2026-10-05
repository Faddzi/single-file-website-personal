create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text,
  urgency text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

create policy "Allow anon inserts to submissions"
on public.contact_submissions for insert
with check (true);

create policy "Allow authenticated reads for admins"
on public.contact_submissions for select
using (auth.role() = 'authenticated');
