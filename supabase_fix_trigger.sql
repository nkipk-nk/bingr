-- Remove auto-generated usernames from the trigger entirely.
-- The trigger just creates a minimal profile row.
-- Email signup users have their username saved by the app before this runs.
-- Google OAuth users get prompted to set username via Edit Profile.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Insert a blank profile — username will be set by the app
  -- Use a temp unique placeholder to satisfy the unique constraint
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
