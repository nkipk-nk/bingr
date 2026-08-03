-- Comments on movie/TV titles
create table if not exists public.bingr_comments (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  tmdb_id integer not null,
  media_type text not null,
  comment text not null,
  status text not null default 'visible', -- visible | hidden | flagged
  flag_count integer not null default 0,
  created_at timestamptz default now()
);

alter table public.bingr_comments enable row level security;

create policy "Anyone can view visible comments"
  on public.bingr_comments for select
  using (status = 'visible');

create policy "Admins can view all comments"
  on public.bingr_comments for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Logged in users can post comments"
  on public.bingr_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.bingr_comments for delete
  using (auth.uid() = user_id);

create policy "Admins can update/delete any comment"
  on public.bingr_comments for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete any comment"
  on public.bingr_comments for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Comment flags/reports — separate table so we know who flagged what
create table if not exists public.bingr_comment_flags (
  id bigserial primary key,
  comment_id bigint references public.bingr_comments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reason text,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

alter table public.bingr_comment_flags enable row level security;

create policy "Users can flag comments"
  on public.bingr_comment_flags for insert
  with check (auth.uid() = user_id);

create policy "Admins can view flags"
  on public.bingr_comment_flags for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index if not exists idx_comments_title on public.bingr_comments(tmdb_id, media_type, created_at desc);
create index if not exists idx_comments_user on public.bingr_comments(user_id);
