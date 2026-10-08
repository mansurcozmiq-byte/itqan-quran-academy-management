-- Itqan Quran Academy Management - Schema v3
-- Run in Supabase SQL Editor

create sequence if not exists adm_seq;
create sequence if not exists rcpt_seq;
grant usage on sequence adm_seq, rcpt_seq to authenticated;

create table if not exists courses(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_fee numeric not null default 0,
  active bool default true
);

create table if not exists settings(k text primary key, v numeric);
insert into settings values('admission_fee',0) on conflict do nothing;

create table if not exists fee_history(
  id uuid primary key default gen_random_uuid(),
  item text, old_fee numeric, new_fee numeric,
  changed_by text, changed_at timestamptz default now()
);

create table if not exists students(
  id uuid primary key default gen_random_uuid(),
  adm_no text unique default 'AIQ-'||to_char(now(),'YYYY')||'-'||lpad(nextval('adm_seq')::text,3,'0'),
  adm_date date default current_date,
  name text not null,
  father text, mother text, dob date, age text,
  school text, class text,
  guardian text, relation text,
  mobile text, whatsapp text,
  address text,
  photo_url text,
  courses text[] default '{}',
  batch text, class_time text,
  mode text default 'offline',
  online_link text,
  teacher_id uuid,
  current_para text, current_surah text,
  sobok text, sabqi text, manzil text,
  progress_notes text,
  adm_fee numeric default 0, adm_disc numeric default 0,
  mon_fee numeric default 0, mon_disc numeric default 0,
  fee_words text,
  status text default 'Active',
  created_at timestamptz default now()
);

do $$ begin
  alter table students add column if not exists whatsapp text;
  alter table students add column if not exists photo_url text;
  alter table students add column if not exists mode text default 'offline';
  alter table students add column if not exists online_link text;
  alter table students add column if not exists teacher_id uuid;
  alter table students add column if not exists current_para text;
  alter table students add column if not exists current_surah text;
  alter table students add column if not exists sobok text;
  alter table students add column if not exists sabqi text;
  alter table students add column if not exists manzil text;
  alter table students add column if not exists progress_notes text;
exception when others then null; end $$;

create table if not exists payments(
  id uuid primary key default gen_random_uuid(),
  rcpt_no text unique default 'R-'||lpad(nextval('rcpt_seq')::text,5,'0'),
  student_id uuid references students on delete cascade,
  kind text, month text, amount numeric,
  paid_on date default current_date, note text
);

create table if not exists teachers(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text, whatsapp text,
  specialization text, batch text,
  active bool default true,
  salary numeric default 0,
  created_at timestamptz default now()
);

create table if not exists attendance(
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students on delete cascade,
  date date not null default current_date,
  status text not null default 'Present',
  note text, marked_by text,
  unique(student_id, date)
);

create table if not exists documents(
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students on delete cascade,
  title text not null,
  file_url text not null,
  uploaded_at timestamptz default now()
);

create table if not exists expenses(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  amount numeric not null,
  expense_date date default current_date,
  note text, created_by text,
  created_at timestamptz default now()
);

create table if not exists activity_log(
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity text, entity_id text, details text,
  done_by text, created_at timestamptz default now()
);

-- Staff roles (admin | staff)
create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text default 'staff' check (role in ('admin','staff')),
  name text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, name)
  values (new.id, new.email, 'admin', split_part(new.email,'@',1))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into courses(name, monthly_fee)
select * from (values
  ('Nazera', 0),('Hifz', 0),('Tajweed', 0),('Noorani Qaida', 0),
  ('Moulik Islam Shikkha', 0),('Sirat o Choritro Gothon', 0),
  ('Hand Writing', 0),('Arabic', 0)
) as v(name, monthly_fee)
where not exists (select 1 from courses limit 1);

-- RLS
do $$ declare t text; begin
  foreach t in array array['courses','settings','fee_history','students','payments','teachers','attendance','documents','expenses','activity_log','profiles'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "auth all" on %I', t);
    execute format('create policy "auth all" on %I for all to authenticated using(true) with check(true)', t);
  end loop;
end $$;

-- STORAGE: create buckets in Supabase Dashboard > Storage
-- 1. Create bucket "photos" (public)
-- 2. Create bucket "documents" (public or private)
-- Policies example:
-- insert: authenticated users can upload
-- select: public read for photos
