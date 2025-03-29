-- Create groups table
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  institution text not null,
  delivery_date date not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_proceso', 'completado', 'entregado', 'cancelado')),
  comments text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create group_members table
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid not null references public.groups(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, customer_id)
);

-- Create photo_packages table
create table if not exists public.photo_packages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  base_price numeric(10,2) not null check (base_price >= 0),
  options jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add group_id and package_id to orders table
alter table if exists public.orders
  add column if not exists group_id uuid references public.groups(id) on delete set null,
  add column if not exists package_id uuid references public.photo_packages(id) on delete set null;

-- Create RLS policies for groups
alter table public.groups enable row level security;

create policy "Enable read access for authenticated users" on public.groups
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users" on public.groups
  for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users" on public.groups
  for update
  to authenticated
  using (true);

-- Create RLS policies for group_members
alter table public.group_members enable row level security;

create policy "Enable read access for authenticated users" on public.group_members
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users" on public.group_members
  for insert
  to authenticated
  with check (true);

create policy "Enable delete access for authenticated users" on public.group_members
  for delete
  to authenticated
  using (true);

-- Create RLS policies for photo_packages
alter table public.photo_packages enable row level security;

create policy "Enable read access for authenticated users" on public.photo_packages
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users" on public.photo_packages
  for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users" on public.photo_packages
  for update
  to authenticated
  using (true);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger handle_updated_at
  before update on public.groups
  for each row
  execute function public.handle_updated_at();

create trigger handle_updated_at
  before update on public.photo_packages
  for each row
  execute function public.handle_updated_at(); 