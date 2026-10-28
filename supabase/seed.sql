-- Demo registrar counters and a day that is already in progress.
-- Staff logins are created separately by `npm run seed:staff`.

insert into public.service_counters (id, name, code, location, is_active, avg_service_seconds)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Registrar Window 1',
    'REG1',
    'Main hall, window 1',
    true,
    180
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Registrar Window 2',
    'REG2',
    'Main hall, window 2',
    true,
    180
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'ID and Clearance',
    'IDSK',
    'Admin building, room 102',
    true,
    240
  );

insert into public.queues (
  id,
  counter_id,
  service_date,
  status,
  current_serving_number,
  last_issued_number,
  opened_at,
  closed_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    public.campus_today(),
    'open',
    5,
    8,
    now() - interval '2 hours',
    null
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    public.campus_today(),
    'open',
    0,
    0,
    now() - interval '2 hours',
    null
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '11111111-1111-4111-8111-111111111111',
    public.campus_today() - 1,
    'closed',
    6,
    6,
    now() - interval '26 hours',
    now() - interval '20 hours'
  );

insert into public.queue_tickets (
  queue_id,
  ticket_number,
  public_code,
  client_key,
  customer_name,
  purpose,
  status,
  issued_at,
  called_at,
  served_at,
  closed_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    1, 'H4K9M2PA', gen_random_uuid(), 'Ana Reyes', 'Enrollment', 'served',
    now() - interval '50 minutes',
    now() - interval '40 minutes',
    now() - interval '40 minutes' + interval '150 seconds',
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    2, 'Q8N3L6RT', gen_random_uuid(), 'Luis Garcia', 'Transcript', 'served',
    now() - interval '44 minutes',
    now() - interval '34 minutes',
    now() - interval '34 minutes' + interval '180 seconds',
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    3, 'B2C7D9FW', gen_random_uuid(), 'Bea Flores', 'Grades', 'served',
    now() - interval '36 minutes',
    now() - interval '28 minutes',
    now() - interval '28 minutes' + interval '200 seconds',
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    4, 'M5P8R3VK', gen_random_uuid(), 'Nico Ramos', 'Clearance', 'served',
    now() - interval '24 minutes',
    now() - interval '18 minutes',
    now() - interval '18 minutes' + interval '210 seconds',
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    5, 'T6W4Y7HN', gen_random_uuid(), 'Maya Santos', 'Enrollment', 'called',
    now() - interval '12 minutes',
    now() - interval '2 minutes',
    null,
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    6, 'C3F8J2QX', gen_random_uuid(), 'Paolo Cruz', 'ID Replacement', 'waiting',
    now() - interval '8 minutes', null, null, null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    7, 'G5L9N4SB', gen_random_uuid(), 'Aira Mendoza', 'Transcript', 'waiting',
    now() - interval '5 minutes', null, null, null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    8, 'D7R2V6YK', gen_random_uuid(), 'Jonah Lim', 'Other', 'waiting',
    now() - interval '2 minutes', null, null, null
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    1, 'Y4K8N2PA', gen_random_uuid(), 'Elena Torres', 'Enrollment', 'served',
    now() - interval '26 hours',
    now() - interval '25 hours',
    now() - interval '25 hours' + interval '160 seconds',
    null
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    2, 'R7M3Q5LT', gen_random_uuid(), 'Carlo Diaz', 'Grades', 'served',
    now() - interval '25 hours',
    now() - interval '24 hours',
    now() - interval '24 hours' + interval '190 seconds',
    null
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    3, 'F2C9D6HW', gen_random_uuid(), 'Sofia Navarro', 'Transcript', 'served',
    now() - interval '24 hours',
    now() - interval '23 hours',
    now() - interval '23 hours' + interval '175 seconds',
    null
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    4, 'J5P8S3VK', gen_random_uuid(), 'Marco Villanueva', 'Clearance', 'skipped',
    now() - interval '23 hours',
    now() - interval '22 hours',
    null,
    now() - interval '22 hours' + interval '3 minutes'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    5, 'K8N4P2QM', gen_random_uuid(), 'Liza Bautista', 'Other', 'cancelled',
    now() - interval '23 hours',
    null,
    null,
    now() - interval '22 hours'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    6, 'W3H7T5RN', gen_random_uuid(), 'Andre Pascual', 'ID Replacement', 'served',
    now() - interval '22 hours',
    now() - interval '21 hours',
    now() - interval '21 hours' + interval '200 seconds',
    null
  );
