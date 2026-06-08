-- Add role to profiles
alter table public.profiles
  add column if not exists role text not null default 'user',
  add column if not exists username_set boolean not null default false,
  add column if not exists country_code text,
  add column if not exists last_seen_at timestamptz;

-- Feedback table
create table if not exists public.bingr_feedback (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  username text,
  email text,
  category text not null default 'general',
  message text not null,
  status text not null default 'unread',
  created_at timestamptz default now()
);

alter table public.bingr_feedback enable row level security;

create policy "Users can submit feedback"
  on public.bingr_feedback for insert
  with check (true);

create policy "Admins can read all feedback"
  on public.bingr_feedback for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Donations table
create table if not exists public.bingr_donations (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  username text,
  amount_kes integer not null,
  confirmed boolean default false,
  show_on_wall boolean default false,
  note text,
  donated_at timestamptz default now()
);

alter table public.bingr_donations enable row level security;

create policy "Admins manage donations"
  on public.bingr_donations for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can see their own donations"
  on public.bingr_donations for select
  using (auth.uid() = user_id);

create policy "Public can see confirmed wall donations"
  on public.bingr_donations for select
  using (confirmed = true and show_on_wall = true);

-- Set yourself as admin (run separately after finding your user ID)
-- update public.profiles set role = 'admin' where id = 'your-user-uuid-here';
