create extension if not exists pgcrypto;

create table if not exists doctor_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  specialty text not null,
  years_experience int not null check (years_experience between 0 and 60),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists doctor_applications_email_uq on doctor_applications (lower(email));
create index if not exists doctor_applications_status_idx on doctor_applications (status, created_at desc);

-- Files live in Postgres (bytea) so Neon is the only service you need.
create table if not exists application_files (
  application_id uuid not null references doctor_applications(id) on delete cascade,
  kind text not null check (kind in ('license','photo')),
  mime text not null,
  data bytea not null,
  primary key (application_id, kind)
);
