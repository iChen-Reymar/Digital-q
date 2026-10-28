import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_STAFF_PASSWORD || "NumeraStaff#2026";

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env values in .env.local");
  process.exit(1);
}

function check(condition, label) {
  if (!condition) {
    console.error(`FAIL ${label}`);
    process.exit(1);
  }
  console.log(`ok ${label}`);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const anonRows = await fetch(`${url}/rest/v1/queue_tickets?select=id,customer_name`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});
const anonBody = await anonRows.json();
check(!(Array.isArray(anonBody) && anonBody.length > 0), "anon key cannot read ticket rows");

const serviceRows = await fetch(`${url}/rest/v1/queue_tickets?select=id`, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
});
const serviceBody = await serviceRows.json();
check(Array.isArray(serviceBody) && serviceBody.length > 0, `service role sees ${Array.isArray(serviceBody) ? serviceBody.length : 0} ticket ids`);

const listed = await anon.rpc("list_public_counters");
check(listed.data?.ok === true, "public counter list");
const counters = listed.data.counters;
const window1 = counters.find((counter) => counter.code === "REG1");
const window2 = counters.find((counter) => counter.code === "REG2");
check(window1 && window2, "seeded registrar windows");
check(window1.now_serving === 5, "window 1 is serving 005");
check(!counters.some((counter) => "customer_name" in counter), "public board has no customer names");

const denied = await anon.rpc("call_next", { p_queue_id: window1.queue_id });
check(Boolean(denied.error), "anon cannot call the next number");

const clientKey = crypto.randomUUID();
const issued = await anon.rpc("issue_ticket", {
  p_counter_id: window2.id,
  p_customer_name: "Ana Cruz",
  p_purpose: "Enrollment",
  p_client_key: clientKey,
});
check(issued.data?.ok === true && issued.data.ticket_number === 1, "first window 2 ticket is 001");
check(issued.data.people_ahead === 0, "empty queue says you are next");

const duplicate = await anon.rpc("issue_ticket", {
  p_counter_id: window2.id,
  p_customer_name: "Ana Cruz",
  p_purpose: "Enrollment",
  p_client_key: clientKey,
});
check(duplicate.data?.error === "active_ticket", "same browser cannot hold two active tickets");

const sameName = await anon.rpc("issue_ticket", {
  p_counter_id: window2.id,
  p_customer_name: "Ana Cruz",
  p_purpose: "Transcript",
  p_client_key: crypto.randomUUID(),
});
check(sameName.data?.error === "duplicate_name", "same name cannot hold two active tickets");

const badPurpose = await anon.rpc("issue_ticket", {
  p_counter_id: window2.id,
  p_customer_name: "Ben Cruz",
  p_purpose: "Parking",
  p_client_key: crypto.randomUUID(),
});
check(badPurpose.data?.error === "invalid_purpose", "purpose must be on the list");

const badName = await anon.rpc("issue_ticket", {
  p_counter_id: window2.id,
  p_customer_name: "Ana1",
  p_purpose: "Grades",
  p_client_key: crypto.randomUUID(),
});
check(badName.data?.error === "invalid_name", "digits are rejected in a name");

const cancelled = await anon.rpc("cancel_my_ticket", {
  p_public_code: issued.data.public_code,
  p_client_key: clientKey,
});
check(cancelled.data?.status === "cancelled", "customer can cancel their waiting ticket");

const staff = createClient(url, anonKey, { auth: { persistSession: false } });
const signedIn = await staff.auth.signInWithPassword({
  email: "staff@campus.edu",
  password,
});
check(!signedIn.error, "staff can sign in");

const desk = await staff.rpc("get_staff_desk", { p_counter_id: window1.id });
check(desk.data?.ok === true, "staff desk loads");
const called = desk.data.tickets.find((ticket) => ticket.status === "called");
check(called?.ticket_number === 5, "desk shows the called ticket");

const served = await staff.rpc("mark_served", { p_ticket_id: called.id });
check(served.data?.ok === true, "staff can mark the called ticket served");

const next = await staff.rpc("call_next", { p_queue_id: desk.data.queue_id });
check(next.data?.ok === true, "staff can call the next number");

const board = await anon.rpc("get_board", { p_counter_id: window1.id });
check(board.data?.now_serving === 6, "public board moved to 006");

console.log("All queue checks passed.");
