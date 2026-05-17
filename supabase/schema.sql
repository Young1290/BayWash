-- WashNear MVP schema for Supabase
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_e164 text not null unique,
  referral_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  address text not null,
  carpark_location text not null,
  car_plate text,
  car_photo_url text,
  plate_photo_url text,
  plan_type text not null check (plan_type in ('single', 'monthly')),
  car_available_date date not null check (car_available_date >= current_date),
  car_available_slot text not null check (car_available_slot in ('night_1', 'night_2', 'night_3', 'night_4')),
  referrer_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status text not null check (status in ('pending', 'qualified', 'rewarded')) default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_referrer_code on public.bookings(referrer_code);
create index if not exists idx_referrals_referrer_user_id on public.referrals(referrer_user_id);
create index if not exists idx_referrals_referred_user_id on public.referrals(referred_user_id);
create unique index if not exists uq_referrals_triplet
  on public.referrals(referrer_user_id, referred_user_id, booking_id);

alter table public.users
  drop constraint if exists users_referral_code_format_check;
alter table public.users
  add constraint users_referral_code_format_check
  check (referral_code ~ '^[A-Z0-9]{6,12}$');

alter table public.users
  drop constraint if exists users_phone_e164_my_mobile_check;
alter table public.users
  add constraint users_phone_e164_my_mobile_check
  check (phone_e164 ~ '^\+60(1\d{7,8})$');

alter table public.bookings
  add column if not exists car_plate text;

alter table public.bookings
  add column if not exists car_photo_url text;

alter table public.bookings
  add column if not exists plate_photo_url text;

alter table public.bookings
  drop constraint if exists bookings_referrer_code_format_check;
alter table public.bookings
  add constraint bookings_referrer_code_format_check
  check (referrer_code is null or referrer_code ~ '^[A-Z0-9]{6,12}$');

alter table public.bookings
  drop constraint if exists bookings_car_plate_format_check;
alter table public.bookings
  add constraint bookings_car_plate_format_check
  check (
    car_plate is null
    or (
      length(trim(car_plate)) between 3 and 16
      and upper(trim(car_plate)) ~ '^[A-Z0-9 -]+$'
    )
  );

alter table public.bookings
  drop constraint if exists bookings_car_available_date_check;
alter table public.bookings
  add constraint bookings_car_available_date_check
  check (car_available_date >= current_date);

alter table public.bookings
  drop constraint if exists bookings_car_available_weekday_check;
alter table public.bookings
  add constraint bookings_car_available_weekday_check
  check (extract(isodow from car_available_date) between 1 and 5);

alter table public.bookings
  drop constraint if exists bookings_car_available_slot_check;
alter table public.bookings
  add constraint bookings_car_available_slot_check
  check (car_available_slot in ('night_1', 'night_2', 'night_3', 'night_4'));

alter table public.users enable row level security;
alter table public.bookings enable row level security;
alter table public.referrals enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-media', 'booking-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- No direct anonymous table write policies.
-- Anonymous intake should only happen through the RPC function.
drop policy if exists "anon_users_insert" on public.users;
drop policy if exists "anon_bookings_insert" on public.bookings;

drop policy if exists "anon_users_select" on public.users;
drop policy if exists "anon_users_update" on public.users;
drop policy if exists "anon_bookings_select" on public.bookings;
drop policy if exists "anon_referrals_select" on public.referrals;
drop policy if exists "anon_referrals_insert" on public.referrals;
drop policy if exists "booking_media_public_read" on storage.objects;
drop policy if exists "booking_media_anon_insert" on storage.objects;
drop policy if exists "booking_media_auth_insert" on storage.objects;

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'referrals'
  loop
    execute format('drop policy if exists %I on public.referrals', p.policyname);
  end loop;
end;
$$;

create policy "booking_media_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'booking-media');

create policy "booking_media_anon_insert"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'booking-media');

create policy "booking_media_auth_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'booking-media');

create or replace function public.generate_referral_code(code_length integer default 8)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
  attempt integer;
begin
  for attempt in 1..12 loop
    candidate := '';
    for i in 1..code_length loop
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    end loop;

    if not exists (select 1 from public.users u where u.referral_code = candidate) then
      return candidate;
    end if;
  end loop;

  raise exception 'Could not generate unique referral code';
end;
$$;

create or replace function public.submit_booking_mvp_v2(
  p_name text,
  p_phone_e164 text,
  p_address text,
  p_carpark_location text,
  p_plan_type text,
  p_car_available_date date,
  p_car_available_slot text,
  p_car_plate text default null,
  p_car_photo_url text default null,
  p_plate_photo_url text default null,
  p_referrer_code text default null,
  p_referrer_user_id uuid default null
)
returns table (
  user_id uuid,
  user_referral_code text,
  booking_id uuid,
  address text,
  carpark_location text,
  car_plate text,
  car_photo_url text,
  plate_photo_url text,
  plan_type text,
  car_available_date date,
  car_available_slot text,
  referrer_code text,
  booking_created_at timestamptz
)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_user_id uuid;
  v_user_referral_code text;
  v_booking public.bookings%rowtype;
  v_referrer_code text;
  v_referrer_id uuid;
begin
  insert into public.users (name, phone_e164, referral_code)
  values (trim(p_name), p_phone_e164, public.generate_referral_code())
  on conflict (phone_e164) do update
    set name = excluded.name
  returning id, referral_code
  into v_user_id, v_user_referral_code;

  v_referrer_code := upper(trim(coalesce(p_referrer_code, '')));
  if v_referrer_code = '' or v_referrer_code !~ '^[A-Z0-9]{6,12}$' then
    v_referrer_code := null;
  end if;

  if v_referrer_code = v_user_referral_code then
    v_referrer_code := null;
  end if;

  if p_car_available_date < current_date then
    raise exception 'Invalid booking date: must be today or a future date';
  end if;

  if extract(isodow from p_car_available_date) not between 1 and 5 then
    raise exception 'Invalid booking date: weekends are not available';
  end if;

  if p_car_available_slot not in ('night_1', 'night_2', 'night_3', 'night_4') then
    raise exception 'Invalid booking slot: allowed values are night_1, night_2, night_3, night_4';
  end if;

  insert into public.bookings (
    user_id,
    address,
    carpark_location,
    car_plate,
    car_photo_url,
    plate_photo_url,
    plan_type,
    car_available_date,
    car_available_slot,
    referrer_code
  )
  values (
    v_user_id,
    trim(p_address),
    trim(p_carpark_location),
    nullif(upper(trim(coalesce(p_car_plate, ''))), ''),
    nullif(trim(coalesce(p_car_photo_url, '')), ''),
    nullif(trim(coalesce(p_plate_photo_url, '')), ''),
    p_plan_type,
    p_car_available_date,
    p_car_available_slot,
    v_referrer_code
  )
  returning * into v_booking;

  if v_referrer_code is not null then
    select u.id
    into v_referrer_id
    from public.users u
    where u.referral_code = v_referrer_code
    limit 1;
  end if;

  if p_referrer_user_id is not null then
    if v_referrer_id is null then
      raise warning 'Referral user id ignored for booking % because referrer_code is missing/invalid', v_booking.id;
    elsif p_referrer_user_id <> v_referrer_id then
      raise warning 'Referral mismatch for booking %: rid does not match referrer_code owner; code owner is used', v_booking.id;
    end if;
  end if;

  if v_referrer_id is not null and v_referrer_id <> v_user_id then
    begin
      insert into public.referrals (
        referrer_user_id,
        referred_user_id,
        booking_id,
        status
      )
      values (
        v_referrer_id,
        v_user_id,
        v_booking.id,
        'pending'
      )
      on conflict (referrer_user_id, referred_user_id, booking_id) do nothing;
    exception
      when others then
        raise warning 'Referral insert skipped for booking %, reason: %', v_booking.id, SQLERRM;
    end;
  end if;

  return query
  select
    v_user_id,
    v_user_referral_code,
    v_booking.id,
    v_booking.address,
    v_booking.carpark_location,
    v_booking.car_plate,
    v_booking.car_photo_url,
    v_booking.plate_photo_url,
    v_booking.plan_type,
    v_booking.car_available_date,
    v_booking.car_available_slot,
    v_booking.referrer_code,
    v_booking.created_at;
end;
$$;

revoke all on function public.generate_referral_code(integer) from public;
revoke all on function public.submit_booking_mvp_v2(
  text,
  text,
  text,
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  text,
  uuid
) from public;
grant execute on function public.submit_booking_mvp_v2(
  text,
  text,
  text,
  text,
  text,
  date,
  text,
  text,
  text,
  text,
  text,
  uuid
) to anon, authenticated;
