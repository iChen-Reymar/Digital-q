-- Numera schema
-- Digital Queue Ticket and Waiting Time Estimator
--
-- This file is the database structure: tables, relationships, indexes,
-- and access rules. Queue behavior (issue, call next, wait estimate)
-- lives in supabase/migrations/20261028120000_queue.sql.
-- Apply that migration with `npm run db:reset`. Do not run this file
-- against a database that already has the migration.

-- service_counters
-- A window that issues numbers for the day. avg_service_seconds is the
-- fallback wait when fewer than three visits have been completed today.

create table public.service_counters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  location text not null,
  is_active boolean not null default true,
  avg_service_seconds integer not null default 180,
  created_at timestamptz not null default now(),
  constraint service_counters_name_len check (char_length(name) between 3 and 80),
  constraint service_counters_code_format check (code ~ '^[A-Z0-9]{2,6}$'),
  constraint service_counters_location_len check (char_length(location) between 3 and 120),
  constraint service_counters_avg_range check (avg_service_seconds between 30 and 3600)
);

comment on table public.service_counters is 'Service windows that issue queue numbers.';
comment on column public.service_counters.code is 'Short board label, such as REG1.';
comment on column public.service_counters.avg_service_seconds is 'Configured average service time, used until three visits are observed.';

-- queues
-- One row per counter per campus day (Asia/Manila). A counter with history
-- cannot be deleted, because this foreign key is ON DELETE RESTRICT.

create table public.queues (
  id uuid primary key default gen_random_uuid(),
  counter_id uuid not null references public.service_counters (id) on delete restrict,
  service_date date not null,
  status text not null default 'open',
  current_serving_number integer not null default 0,
  last_issued_number integer not null default 0,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint queues_one_per_counter_per_day unique (counter_id, service_date),
  constraint queues_status_values check (status in ('open', 'paused', 'closed')),
  constraint queues_serving_nonnegative check (current_serving_number >= 0),
  constraint queues_issued_nonnegative check (last_issued_number >= 0)
);

comment on table public.queues is 'One queue per counter per campus day (Asia/Manila).';
comment on column public.queues.current_serving_number is 'Last number called at this counter today.';
comment on column public.queues.last_issued_number is 'Highest ticket number issued today. Numbers are not reused.';

-- queue_tickets
-- Cancellation is a status change, not a row delete, so the daily record stays.
-- One browser and one name can hold only one waiting or called ticket per queue.

create table public.queue_tickets (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues (id) on delete restrict,
  ticket_number integer not null,
  public_code text not null unique,
  client_key uuid not null,
  customer_name text,
  purpose text not null,
  status text not null default 'waiting',
  issued_at timestamptz not null default now(),
  called_at timestamptz,
  served_at timestamptz,
  closed_at timestamptz,
  constraint queue_tickets_number_positive check (ticket_number > 0),
  constraint queue_tickets_unique_number unique (queue_id, ticket_number),
  constraint queue_tickets_code_format check (public_code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  constraint queue_tickets_name_len check (
    customer_name is null or char_length(customer_name) between 2 and 80
  ),
  constraint queue_tickets_purpose check (
    purpose in ('Enrollment', 'Transcript', 'Grades', 'ID Replacement', 'Clearance', 'Other')
  ),
  constraint queue_tickets_status_values check (
    status in ('waiting', 'called', 'served', 'skipped', 'cancelled')
  ),
  constraint queue_tickets_times_match_status check (
    (status = 'waiting' and called_at is null and served_at is null and closed_at is null)
    or (status = 'called' and called_at is not null and served_at is null and closed_at is null)
    or (
      status = 'served'
      and called_at is not null
      and served_at is not null
      and served_at >= called_at
      and closed_at is null
    )
    or (status = 'skipped' and called_at is not null and served_at is null and closed_at is not null)
    or (status = 'cancelled' and served_at is null and closed_at is not null)
  )
);

create unique index queue_tickets_one_active_client_idx
  on public.queue_tickets (queue_id, client_key)
  where status in ('waiting', 'called');

create unique index queue_tickets_one_active_name_idx
  on public.queue_tickets (queue_id, lower(customer_name))
  where status in ('waiting', 'called') and customer_name is not null;

create index queue_tickets_queue_status_number_idx
  on public.queue_tickets (queue_id, status, ticket_number);

comment on table public.queue_tickets is 'Issued tickets. Active means waiting or called.';
comment on column public.queue_tickets.public_code is 'Unguessable code used on the customer ticket page.';
comment on column public.queue_tickets.client_key is 'Browser key. Blocks a second active ticket at the same counter.';

-- profiles
-- Staff identity. A signed-in user with no profile cannot open the desk.
-- The migration adds a trigger on auth.users that inserts this row.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  constraint profiles_role_values check (role in ('staff')),
  constraint profiles_name_len check (char_length(full_name) between 2 and 80)
);

comment on table public.profiles is 'Staff accounts. A login without a profile cannot run the desk.';

-- Relationships
--
--   auth.users 1 ──< profiles
--   service_counters 1 ──< queues 1 ──< queue_tickets
--
-- Access
-- Customers never select these tables. They call list_public_counters,
-- get_board, get_ticket, issue_ticket, and cancel_my_ticket.
-- Staff calls go through functions that require a profiles row.
-- The public board returns numbers only. Names stay on the staff desk.

alter table public.service_counters enable row level security;
alter table public.queues enable row level security;
alter table public.queue_tickets enable row level security;
alter table public.profiles enable row level security;

create policy "staff read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

revoke all on table public.service_counters from public, anon, authenticated;
revoke all on table public.queues from public, anon, authenticated;
revoke all on table public.queue_tickets from public, anon, authenticated;
revoke all on table public.profiles from public, anon;
grant select on table public.profiles to authenticated;
