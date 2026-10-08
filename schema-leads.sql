-- Run this in the SAME Supabase project as management app
-- Website form submissions → leads table

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  child_name text not null,
  age text,
  phone text not null,
  course text,
  message text,
  status text default 'New' check (status in ('New', 'Contacted', 'Admitted', 'Rejected')),
  note text,
  created_at timestamptz default now()
);

alter table leads enable row level security;

-- Public website can INSERT only (no login)
drop policy if exists "public insert leads" on leads;
create policy "public insert leads" on leads
  for insert to anon, authenticated
  with check (true);

-- Only logged-in staff can read/update/delete
drop policy if exists "auth read leads" on leads;
create policy "auth read leads" on leads
  for select to authenticated
  using (true);

drop policy if exists "auth update leads" on leads;
create policy "auth update leads" on leads
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists "auth delete leads" on leads;
create policy "auth delete leads" on leads
  for delete to authenticated
  using (true);
