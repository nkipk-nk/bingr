-- Diary entries — separate from bingr_library status tracking
-- A title can be "watched" (status) AND have multiple diary entries (rewatches)
create table if not exists public.bingr_diary (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null,
  title text,
  poster_path text,
  release_date text,
  watched_date date not null default current_date,
  rewatch boolean default false,
  rating integer,
  notes text,
  created_at timestamptz default now()
);

alter table public.bingr_diary enable row level security;

create policy "Users manage own diary"
  on public.bingr_diary for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public diary visible to all"
  on public.bingr_diary for select
  using (true);

-- Make profiles publicly viewable (already has select policy, but ensure)
-- Allow public to view a user's library if their profile allows it
alter table public.profiles
  add column if not exists profile_public boolean not null default true,
  add column if not exists bio text;

create index if not exists idx_diary_user_date on public.bingr_diary(user_id, watched_date desc);
