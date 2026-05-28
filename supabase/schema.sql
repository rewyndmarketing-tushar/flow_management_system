create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  role text not null,
  created_at timestamptz default now()
);

create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  task text not null,
  tat text not null,
  frequency text not null default 'daily',
  "order" int not null default 0
);

create table checklist_entries (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references checklist_templates(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null default current_date,
  done boolean not null default false,
  updated_at timestamptz default now(),
  unique(template_id, user_id, date)
);

create table fms_processes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  department text not null,
  steps jsonb not null default '[]'
);

create table fms_entries (
  id uuid primary key default gen_random_uuid(),
  process_id uuid references fms_processes(id) on delete cascade,
  ref_no text not null,
  date date not null default current_date,
  client text default '',
  contact text default '',
  step_1_pln date, step_1_act date,
  step_2_pln date, step_2_act date,
  step_3_pln date, step_3_act date,
  step_4_pln date, step_4_act date,
  step_5_pln date, step_5_act date,
  step_6_pln date, step_6_act date,
  step_7_pln date, step_7_act date,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table compliance_items (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  owner_role text not null,
  due_date date not null,
  frequency text not null,
  contact_person text,
  last_done date
);

create table kra_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  qty_planned int default 0, qty_actual int default 0,
  qual_planned int default 0, qual_actual int default 0,
  time_planned int default 0, time_actual int default 0,
  cost_planned int default 0, cost_actual int default 0,
  unique(user_id, week_start)
);

alter table profiles enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_entries enable row level security;
alter table fms_processes enable row level security;
alter table fms_entries enable row level security;
alter table compliance_items enable row level security;
alter table kra_scores enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = user_id);
create policy "managers read all profiles" on profiles for select using (
  exists (select 1 from profiles where user_id = auth.uid() and role in ('ea','owner','mis'))
);
create policy "read templates" on checklist_templates for select using (true);
create policy "write templates" on checklist_templates for all using (
  exists (select 1 from profiles where user_id = auth.uid() and role in ('mis','owner'))
);
create policy "own entries" on checklist_entries for all using (auth.uid() = user_id);
create policy "managers read entries" on checklist_entries for select using (
  exists (select 1 from profiles where user_id = auth.uid() and role in ('ea','owner','mis'))
);
create policy "read processes" on fms_processes for select using (true);
create policy "write processes" on fms_processes for all using (
  exists (select 1 from profiles where user_id = auth.uid() and role in ('mis','owner'))
);
create policy "fms entries all" on fms_entries for all using (auth.uid() is not null);
create policy "read compliance" on compliance_items for select using (true);
create policy "write compliance" on compliance_items for all using (
  exists (select 1 from profiles where user_id = auth.uid() and role in ('ea','mis','owner'))
);
create policy "own kra" on kra_scores for all using (auth.uid() = user_id);
create policy "managers read kra" on kra_scores for select using (
  exists (select 1 from profiles where user_id = auth.uid() and role in ('ea','owner','mis'))
);