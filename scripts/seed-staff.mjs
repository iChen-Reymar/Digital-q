import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = "staff@campus.edu";
const password = process.env.SEED_STAFF_PASSWORD || "NumeraStaff#2026";
const fullName = "Registrar Staff";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const created = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});

let userId = created.data.user?.id ?? null;

if (!userId) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) throw listed.error;
  const existing = listed.data.users.find((user) => user.email?.toLowerCase() === email);
  if (!existing) throw new Error(created.error?.message ?? "Could not create the staff user");

  const updated = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (updated.error) throw updated.error;
  userId = existing.id;
}

const profile = await admin.from("profiles").upsert({
  id: userId,
  full_name: fullName,
  role: "staff",
});

if (profile.error) throw profile.error;

console.log(`Staff account ready: ${email}`);
