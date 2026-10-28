import type { ZodType } from "zod";
import { createClient } from "@/lib/supabase/server";
import { errorSchema, type RpcError } from "@/types/queue";

export async function callRpc<T>(
  fn: string,
  args: Record<string, unknown>,
  schema: ZodType<T>,
): Promise<T | RpcError> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);

  if (error) {
    console.error(fn, error.message);
    return { ok: false, error: "request_failed" };
  }

  let payload = data;
  if (typeof data === "string") {
    try {
      payload = JSON.parse(data);
    } catch {
      return { ok: false, error: "request_failed" };
    }
  }
  const parsed = schema.safeParse(payload);
  if (parsed.success) return parsed.data;

  const failure = errorSchema.safeParse(payload);
  if (failure.success) return failure.data;

  console.error(fn, parsed.error.issues);
  return { ok: false, error: "request_failed" };
}
