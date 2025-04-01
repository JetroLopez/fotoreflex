-- Create contact_messages table
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  message_hash text not null unique,
  is_reviewed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.contact_messages enable row level security;

-- Create policies
create policy "Enable read access for authenticated users" on public.contact_messages
  for select
  to authenticated
  using (true);

create policy "Enable insert access for all users" on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

create policy "Enable update access for authenticated users" on public.contact_messages
  for update
  to authenticated
  using (true);

create policy "Enable delete access for authenticated users" on public.contact_messages
  for delete
  to authenticated
  using (true); 