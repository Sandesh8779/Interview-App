create extension if not exists "uuid-ossp";

create type public.user_role as enum ('admin', 'interviewer', 'candidate');
create type public.interview_status as enum ('scheduled', 'in_progress', 'submitted', 'reviewed', 'cancelled');
create type public.question_type as enum ('text', 'code', 'video');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'candidate',
  created_at timestamptz not null default now()
);

create table public.interviews (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  interviewer_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 45,
  status public.interview_status not null default 'scheduled',
  rating integer check (rating between 1 and 10),
  feedback text,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  prompt text not null,
  type public.question_type not null default 'text',
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null,
  submitted_at timestamptz not null default now()
);

create index interviews_candidate_id_idx on public.interviews(candidate_id);
create index interviews_interviewer_id_idx on public.interviews(interviewer_id);
create index questions_interview_id_idx on public.questions(interview_id);
create index submissions_interview_id_idx on public.submissions(interview_id);

alter table public.profiles enable row level security;
alter table public.interviews enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;

create policy "Profiles can read themselves"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Service role manages profiles"
  on public.profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages interviews"
  on public.interviews for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages questions"
  on public.questions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages submissions"
  on public.submissions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'candidate')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
