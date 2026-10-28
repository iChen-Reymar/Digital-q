import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

const env = getSupabaseEnv();

if (!env) {
  throw new Error("Missing Supabase URL or publishable key.");
}

export const supabase = createClient(env.url, env.anonKey);
