-- SPOTY: database schema, rules and permissions (Supabase / Postgres).
-- Run once in Supabase: SQL Editor -> New query -> paste this file -> Run.

create extension if not exists citext;

-- ---------------------------------------------------------------- settings
-- One row of app-wide settings (current season, closing time).
create table public.settings (
  id boolean primary key default true check (id),
  season int not null default 2027,
  voting_closes_at timestamptz not null default '2027-12-31 23:59:59 Europe/London'
);
insert into public.settings default values;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle citext not null unique check (handle ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  first_name text not null check (char_length(first_name) between 1 and 40),
  last_name text not null check (char_length(last_name) between 1 and 40),
  photo_url text,
  country char(2) not null check (country ~ '^[A-Z]{2}$'),
  area text check (char_length(area) <= 60),
  job_title text check (char_length(job_title) <= 60),
  profession text check (char_length(profession) <= 60),
  company text check (char_length(company) <= 80),
  pronouns text check (char_length(pronouns) <= 20),
  bio text check (char_length(bio) <= 200),
  show_age boolean not null default false,
  is_admin boolean not null default false,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Date of birth is private: only the member themselves can read it. Everyone else only ever sees an age.
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date not null check (date_of_birth > '1900-01-01')
);

-- ---------------------------------------------------------------- votes
create table public.votes (
  id bigint generated always as identity primary key,
  season int not null,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  voter_id uuid references public.profiles (id) on delete set null,   -- a member voting
  voter_email citext,                                                -- a paying public voter (payments phase)
  kind text not null check (kind in ('member_free', 'member_paid', 'public_paid')),
  message text check (char_length(message) <= 300),
  created_at timestamptz not null default now(),
  check (voter_id is distinct from candidate_id),
  check (voter_id is not null or voter_email is not null)
);
-- One vote per person per salesperson per season (paid votes included).
create unique index votes_one_per_member on public.votes (season, candidate_id, voter_id) where voter_id is not null;
create unique index votes_one_per_email on public.votes (season, candidate_id, voter_email) where voter_email is not null;
-- Each member gets one free vote per season.
create unique index votes_one_free on public.votes (season, voter_id) where kind = 'member_free';
create index votes_candidate on public.votes (candidate_id, season);

-- ---------------------------------------------------------------- vote requests (members asking members, 3 a day)
create table public.vote_requests (
  id bigint generated always as identity primary key,
  season int not null,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (from_id <> to_id),
  unique (season, from_id, to_id)
);
create index vote_requests_from on public.vote_requests (from_id, created_at);

-- ---------------------------------------------------------------- notifications
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('vote', 'request', 'rank', 'system')),
  actor_id uuid references public.profiles (id) on delete set null,
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------- reports (moderation)
create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid references public.profiles (id) on delete set null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('fake', 'impersonation', 'offensive', 'spam', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers
create or replace function public.current_season() returns int
language sql stable security definer set search_path = public as $$ select season from settings $$;

create or replace function public.voting_open() returns boolean
language sql stable security definer set search_path = public as $$ select now() < voting_closes_at from settings $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

-- Members cannot make themselves admin or un-suspend themselves, and their country locks once they have votes.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is empty in the Supabase SQL editor, where you (the owner) can change anything.
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.status := old.status;
    if new.country <> old.country and exists (select 1 from votes where candidate_id = old.id) then
      raise exception 'country_locked' using hint = 'Your country is locked once you have votes.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.profiles_guard();

create or replace function public.profiles_insert_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then new.is_admin := false; new.status := 'active'; end if;
  return new;
end $$;
create trigger profiles_insert_guard before insert on public.profiles for each row execute function public.profiles_insert_guard();

-- Must be 18 or over.
create or replace function public.private_guard() returns trigger
language plpgsql as $$
begin
  if new.date_of_birth > (current_date - interval '18 years') then
    raise exception 'too_young' using hint = 'You must be 18 or over to take part.';
  end if;
  return new;
end $$;
create trigger private_guard before insert or update on public.profile_private for each row execute function public.private_guard();

-- ---------------------------------------------------------------- leaderboards
-- p_scope: 'global' | 'national' | 'age' | 'youngest' | 'oldest'
-- Returns the top p_limit rows plus the signed-in member's own row (is_me) wherever they are.
create or replace function public.leaderboard(p_scope text default 'global', p_country text default null, p_age int default null, p_limit int default 10)
returns table (
  rank bigint, id uuid, handle text, first_name text, last_name text, photo_url text, country text,
  job_title text, profession text, age int, votes bigint, votes_this_month bigint, joined timestamptz, is_me boolean
)
language sql stable security definer set search_path = public as $$
  with s as (select current_season() as season),
  base as (
    select p.id, p.handle::text, p.first_name, p.last_name, p.photo_url, p.country::text, p.job_title, p.profession, p.created_at,
           case when p.show_age then date_part('year', age(pp.date_of_birth))::int end as age,
           pp.date_of_birth,
           (select count(*) from votes v, s where v.candidate_id = p.id and v.season = s.season) as votes,
           (select count(*) from votes v, s where v.candidate_id = p.id and v.season = s.season
              and v.created_at >= date_trunc('month', now() at time zone 'Europe/London') at time zone 'Europe/London') as votes_this_month
    from profiles p left join profile_private pp on pp.id = p.id
    where p.status = 'active'
  ),
  filtered as (
    select * from base b
    where (p_scope <> 'national' or b.country = upper(p_country))
      and (p_scope not in ('age', 'youngest', 'oldest') or b.age is not null)
      and (p_scope <> 'age' or b.age = p_age)
      and (p_country is null or p_scope <> 'global' or b.country = upper(p_country))
  ),
  ranked as (
    select f.*,
      case p_scope
        when 'youngest' then rank() over (order by f.date_of_birth desc)
        when 'oldest' then rank() over (order by f.date_of_birth asc)
        else rank() over (order by f.votes desc)
      end as rnk,
      row_number() over (order by
        case when p_scope = 'youngest' then f.date_of_birth end desc,
        case when p_scope = 'oldest' then f.date_of_birth end asc,
        f.votes desc, f.created_at asc) as pos
    from filtered f
  )
  select r.rnk, r.id, r.handle, r.first_name, r.last_name, r.photo_url, r.country, r.job_title, r.profession,
         r.age, r.votes, r.votes_this_month, r.created_at, (r.id = auth.uid())
  from ranked r
  where r.pos <= least(greatest(p_limit, 1), 100) or r.id = auth.uid()
  order by r.pos
$$;

-- Public profile card, including votes and global/national rank.
create or replace function public.profile_card(p_handle text)
returns table (
  id uuid, handle text, first_name text, last_name text, photo_url text, country text, area text, job_title text,
  profession text, company text, pronouns text, bio text, age int, votes bigint, global_rank bigint, national_rank bigint,
  joined timestamptz, i_voted boolean, is_me boolean
)
language sql stable security definer set search_path = public as $$
  with s as (select current_season() as season),
  totals as (
    select p.id, p.country, (select count(*) from votes v, s where v.candidate_id = p.id and v.season = s.season) as votes
    from profiles p where p.status = 'active'
  ),
  ranks as (
    select t.id, t.votes, rank() over (order by t.votes desc) as g, rank() over (partition by t.country order by t.votes desc) as n from totals t
  )
  select p.id, p.handle::text, p.first_name, p.last_name, p.photo_url, p.country::text, p.area, p.job_title, p.profession,
         p.company, p.pronouns, p.bio,
         case when p.show_age then date_part('year', age(pp.date_of_birth))::int end,
         r.votes, r.g, r.n, p.created_at,
         exists (select 1 from votes v, s where v.candidate_id = p.id and v.voter_id = auth.uid() and v.season = s.season),
         (p.id = auth.uid())
  from profiles p
  join ranks r on r.id = p.id
  left join profile_private pp on pp.id = p.id
  where p.handle = p_handle::citext and p.status = 'active'
$$;

create or replace function public.handle_available(p_handle text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles where handle = p_handle::citext and id is distinct from auth.uid())
$$;

-- ---------------------------------------------------------------- actions
-- A member votes for another member. The first vote of the season is free; after that, paid votes arrive with payments.
create or replace function public.cast_member_vote(p_candidate uuid, p_message text default null)
returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  s int := current_season();
begin
  if me is null then raise exception 'not_signed_in'; end if;
  if not voting_open() then raise exception 'voting_closed'; end if;
  if not exists (select 1 from profiles where id = me and status = 'active') then raise exception 'no_profile'; end if;
  if not exists (select 1 from profiles where id = p_candidate and status = 'active') then raise exception 'not_found'; end if;
  if p_candidate = me then raise exception 'self_vote'; end if;
  if exists (select 1 from votes where season = s and candidate_id = p_candidate and voter_id = me) then raise exception 'already_voted'; end if;
  if exists (select 1 from votes where season = s and voter_id = me and kind = 'member_free') then raise exception 'payment_required'; end if;
  if p_message is not null and char_length(p_message) > 300 then raise exception 'message_too_long'; end if;

  insert into votes (season, candidate_id, voter_id, kind, message)
  values (s, p_candidate, me, 'member_free', nullif(trim(p_message), ''));

  insert into notifications (user_id, type, actor_id, data)
  values (p_candidate, 'vote', me, jsonb_build_object('message', nullif(trim(p_message), '')));
  return 'ok';
end $$;

-- A member asks another member for their vote. Max 3 a day (UK time), once per person per season.
create or replace function public.request_vote(p_to uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  s int := current_season();
  today_start timestamptz := date_trunc('day', now() at time zone 'Europe/London') at time zone 'Europe/London';
  used int;
begin
  if me is null then raise exception 'not_signed_in'; end if;
  if not voting_open() then raise exception 'voting_closed'; end if;
  if not exists (select 1 from profiles where id = me and status = 'active') then raise exception 'no_profile'; end if;
  if not exists (select 1 from profiles where id = p_to and status = 'active') then raise exception 'not_found'; end if;
  if p_to = me then raise exception 'self_request'; end if;
  if exists (select 1 from votes where season = s and candidate_id = me and voter_id = p_to) then raise exception 'already_voted'; end if;
  if exists (select 1 from vote_requests where season = s and from_id = me and to_id = p_to) then raise exception 'already_requested'; end if;
  select count(*) into used from vote_requests where from_id = me and created_at >= today_start;
  if used >= 3 then raise exception 'daily_limit'; end if;

  insert into vote_requests (season, from_id, to_id) values (s, me, p_to);
  insert into notifications (user_id, type, actor_id) values (p_to, 'request', me);
  return 3 - used - 1;   -- requests left today
end $$;

create or replace function public.requests_left_today() returns int
language sql stable security definer set search_path = public as $$
  select greatest(0, 3 - count(*))::int from vote_requests
  where from_id = auth.uid() and created_at >= date_trunc('day', now() at time zone 'Europe/London') at time zone 'Europe/London'
$$;

-- Has the signed-in member used their free vote this season?
create or replace function public.free_vote_used() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from votes where season = current_season() and voter_id = auth.uid() and kind = 'member_free')
$$;

-- ---------------------------------------------------------------- row level security
alter table public.settings enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.votes enable row level security;
alter table public.vote_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

create policy "settings readable" on public.settings for select using (true);
create policy "settings admin" on public.settings for update using (public.is_admin());

create policy "profiles readable" on public.profiles for select using (status = 'active' or id = auth.uid() or public.is_admin());
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "profiles delete own" on public.profiles for delete using (id = auth.uid() or public.is_admin());

create policy "private own" on public.profile_private for all using (id = auth.uid()) with check (id = auth.uid());

-- Votes are written only through cast_member_vote (and later the payments webhook).
create policy "votes visible to the two people involved" on public.votes for select
  using (candidate_id = auth.uid() or voter_id = auth.uid() or public.is_admin());
create policy "votes admin delete" on public.votes for delete using (public.is_admin());

create policy "requests visible to sender and recipient" on public.vote_requests for select using (from_id = auth.uid() or to_id = auth.uid());

create policy "notifications own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications mark read" on public.notifications for update using (user_id = auth.uid());

create policy "reports insert" on public.reports for insert with check (reporter_id = auth.uid());
create policy "reports admin" on public.reports for select using (public.is_admin());
create policy "reports admin update" on public.reports for update using (public.is_admin());

-- ---------------------------------------------------------------- profile photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars own upload" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own update" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own delete" on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
