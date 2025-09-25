create extension if not exists "uuid-ossp";
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  grade int not null check (grade in (11,12)),
  created_at timestamp with time zone default now()
);
create table if not exists public.teacher_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  school text,
  created_at timestamp with time zone default now()
);
create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  grade int check (grade in (11,12)),
  section text,
  created_at timestamp with time zone default now()
);
create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  order_index int not null,
  xp_reward int not null default 10,
  is_published boolean not null default true,
  created_at timestamp with time zone default now(),
  unique(subject_id, order_index)
);
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  prompt text not null,
  explanation text,
  created_at timestamp with time zone default now()
);
create table if not exists public.options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false
);
create table if not exists public.student_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null check (status in ('locked', 'unlocked', 'completed')),
  best_score int default 0,
  last_attempt_at timestamp with time zone,
  unique(student_id, lesson_id)
);
create table if not exists public.xp_ledger (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  amount int not null,
  reason text not null,
  created_at timestamp with time zone default now()
);
create or replace view public.leaderboard as
select sp.id as student_id, coalesce(sum(x.amount),0) as total_xp
from public.student_profiles sp
left join public.xp_ledger x on x.student_id = sp.id
group by sp.id;
create table if not exists public.daily_activity (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  activity_date date not null,
  unique(student_id, activity_date)
);
create table if not exists public.teacher_students (
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (teacher_id, student_id)
);
alter table public.subjects enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.student_progress enable row level security;
alter table public.xp_ledger enable row level security;
alter table public.daily_activity enable row level security;
alter table public.teacher_students enable row level security;
create policy read_curriculum on public.subjects for select using (true);
create policy read_lessons on public.lessons for select using (is_published);
create policy read_questions on public.questions for select using (true);
create policy read_options on public.options for select using (true);
create policy manage_own_teacher on public.teacher_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy manage_own_student on public.student_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy student_progress_owner on public.student_progress for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy xp_owner on public.xp_ledger for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy daily_activity_owner on public.daily_activity for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy teacher_students_teacher_read on public.teacher_students for select using (auth.uid() = teacher_id);
create policy teacher_students_teacher_write on public.teacher_students for insert with check (auth.uid() = teacher_id);
