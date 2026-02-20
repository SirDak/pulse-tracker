-- ============================================================
-- Pulse Tracker — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- user_settings
-- ============================================================
create table if not exists user_settings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       text unique not null default 'default',
  age           integer not null default 30,
  weight_lbs    numeric not null default 175,
  calorie_goal  integer not null default 2500,
  protein_goal  integer not null default 180,
  carbs_goal    integer not null default 250,
  fat_goal      integer not null default 80,
  water_goal_oz integer not null default 100,
  sleep_target_hours numeric not null default 8,
  nutrition_mode text not null default 'full' check (nutrition_mode in ('full', 'simple')),
  hardware      text[] not null default array['apple_watch'],
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- daily_summaries  (one row per calendar day)
-- ============================================================
create table if not exists daily_summaries (
  id                uuid primary key default uuid_generate_v4(),
  date              date unique not null,
  strain_score      numeric,
  recovery_score    numeric,
  hrv_ms            numeric,
  rhr_bpm           integer,
  sleep_hours       numeric,
  sleep_quality     integer check (sleep_quality between 1 and 5),
  energy_level      integer check (energy_level between 1 and 5),
  soreness_level    integer check (soreness_level between 1 and 5),
  stress_level      integer check (stress_level between 1 and 5),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- heart_rate_samples  (individual HR readings from Watch)
-- ============================================================
create table if not exists heart_rate_samples (
  id          uuid primary key default uuid_generate_v4(),
  date        date not null,
  timestamp   timestamptz not null,
  bpm         integer not null,
  context     text,  -- 'resting', 'workout', 'active', etc.
  created_at  timestamptz not null default now()
);
create index if not exists hr_samples_date_idx on heart_rate_samples(date);

-- ============================================================
-- hrv_readings  (HRV from Watch overnight)
-- ============================================================
create table if not exists hrv_readings (
  id          uuid primary key default uuid_generate_v4(),
  date        date not null,
  timestamp   timestamptz not null,
  hrv_ms      numeric not null,
  type        text default 'sdnn',  -- 'sdnn' or 'rmssd'
  created_at  timestamptz not null default now()
);
create index if not exists hrv_date_idx on hrv_readings(date);

-- ============================================================
-- workouts
-- ============================================================
create table if not exists workouts (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null,
  workout_type    text not null,
  duration_min    integer not null,
  avg_hr_bpm      integer,
  max_hr_bpm      integer,
  calories_burned integer,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists workouts_date_idx on workouts(date);

-- ============================================================
-- workout_sets  (individual exercise sets)
-- ============================================================
create table if not exists workout_sets (
  id          uuid primary key default uuid_generate_v4(),
  workout_id  uuid not null references workouts(id) on delete cascade,
  exercise    text not null,
  sets        integer not null default 1,
  reps        integer,
  weight_lbs  numeric,
  created_at  timestamptz not null default now()
);
create index if not exists workout_sets_workout_idx on workout_sets(workout_id);

-- ============================================================
-- meals
-- ============================================================
create table if not exists meals (
  id           uuid primary key default uuid_generate_v4(),
  date         date not null,
  meal_type    text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name    text not null,
  serving_size text,
  calories     integer not null default 0,
  protein_g    numeric not null default 0,
  carbs_g      numeric not null default 0,
  fat_g        numeric not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists meals_date_idx on meals(date);

-- ============================================================
-- water_logs
-- ============================================================
create table if not exists water_logs (
  id         uuid primary key default uuid_generate_v4(),
  date       date not null,
  amount_oz  numeric not null,
  logged_at  timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists water_logs_date_idx on water_logs(date);

-- ============================================================
-- Row Level Security — disable for personal single-user app
-- (re-enable if you add auth later)
-- ============================================================
alter table user_settings       disable row level security;
alter table daily_summaries     disable row level security;
alter table heart_rate_samples  disable row level security;
alter table hrv_readings        disable row level security;
alter table workouts            disable row level security;
alter table workout_sets        disable row level security;
alter table meals               disable row level security;
alter table water_logs          disable row level security;

-- ============================================================
-- Seed default settings row
-- ============================================================
insert into user_settings (user_id) values ('default')
on conflict (user_id) do nothing;
