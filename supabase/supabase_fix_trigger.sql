-- Run this in Supabase SQL Editor
-- Updates the trigger to create a minimal profile row for new users
-- Email signup users: app sets username_set=true after saving username
-- Google OAuth users: username_set=false triggers the onboarding modal

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, username_set)
  values (
    new.id,
    'tmp_' || substr(replace(new.id::text, '-', ''), 1, 12),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
