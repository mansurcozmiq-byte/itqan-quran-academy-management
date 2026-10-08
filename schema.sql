create sequence adm_seq; create sequence rcpt_seq;
grant usage on sequence adm_seq, rcpt_seq to authenticated;

create table courses(id uuid primary key default gen_random_uuid(), name text not null, monthly_fee numeric not null default 0, active bool default true);
create table settings(k text primary key, v numeric);
insert into settings values('admission_fee',0);
create table fee_history(id uuid primary key default gen_random_uuid(), item text, old_fee numeric, new_fee numeric, changed_by text, changed_at timestamptz default now());

create table students(
 id uuid primary key default gen_random_uuid(),
 adm_no text unique default 'AIQ-'||to_char(now(),'YYYY')||'-'||lpad(nextval('adm_seq')::text,3,'0'),
 adm_date date default current_date,
 name text not null, father text, mother text, dob date, age text, school text, class text,
 guardian text, relation text, mobile text, address text,
 courses text[] default '{}', batch text, class_time text,
 adm_fee numeric default 0, adm_disc numeric default 0, mon_fee numeric default 0, mon_disc numeric default 0,
 fee_words text, status text default 'Active', created_at timestamptz default now());

create table payments(
 id uuid primary key default gen_random_uuid(),
 rcpt_no text unique default 'R-'||lpad(nextval('rcpt_seq')::text,5,'0'),
 student_id uuid references students on delete cascade,
 kind text, month text, amount numeric, paid_on date default current_date, note text);

insert into courses(name) values ('Nazera'),('Hifz'),('Moulik Islam Shikkha'),('Sirat o Choritro Gothon'),('Hand Writing');

do $$ declare t text; begin
 foreach t in array array['courses','settings','fee_history','students','payments'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy "auth all" on %I for all to authenticated using(true) with check(true)',t);
 end loop; end $$;
