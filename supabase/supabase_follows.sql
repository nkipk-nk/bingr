-- Follows table
create table if not exists public.bingr_follows (
  id bigserial primary key,
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

alter table public.bingr_follows enable row level security;

create policy "Users manage own follows"
  on public.bingr_follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

create policy "Anyone can see follows"
  on public.bingr_follows for select
  using (true);

-- Index for fast feed queries
create index if not exists idx_follows_follower on public.bingr_follows(follower_id);
create index if not exists idx_follows_following on public.bingr_follows(following_id);
create index if not exists idx_diary_user_created on public.bingr_diary(user_id, watched_date desc);
create index if not exists idx_library_user_updated on public.bingr_library(user_id, updated_at desc);
