-- Lists table
create table if not exists public.bingr_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bingr_lists enable row level security;

create policy "Users manage own lists"
  on public.bingr_lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can view public lists"
  on public.bingr_lists for select
  using (is_public = true);

-- List items table
create table if not exists public.bingr_list_items (
  id bigserial primary key,
  list_id uuid references public.bingr_lists(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null,
  title text,
  poster_path text,
  release_date text,
  vote_average numeric,
  sort_order integer default 0,
  added_at timestamptz default now(),
  unique(list_id, tmdb_id)
);

alter table public.bingr_list_items enable row level security;

create policy "Users manage own list items"
  on public.bingr_list_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can view items of public lists"
  on public.bingr_list_items for select
  using (
    exists (
      select 1 from public.bingr_lists
      where id = list_id and is_public = true
    )
  );
