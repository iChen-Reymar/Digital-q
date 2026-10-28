import { createClient } from "@/lib/supabase/server";
import { dateSchema, publicCodeSchema, uuidSchema } from "@/lib/validators";
import { callRpc } from "@/server/rpc";
import {
  boardSchema,
  counterListSchema,
  deskSchema,
  historySchema,
  ticketViewSchema,
  type RpcError,
} from "@/types/queue";

export async function listPublicCounters() {
  return callRpc("list_public_counters", {}, counterListSchema);
}

export async function getBoard(counterId: string) {
  const id = uuidSchema.safeParse(counterId);
  if (!id.success) return { ok: false as const, error: "counter_unavailable" };
  return callRpc("get_board", { p_counter_id: id.data }, boardSchema);
}

export async function getTicket(code: string) {
  const parsed = publicCodeSchema.safeParse(code);
  if (!parsed.success) return { ok: false as const, error: "not_found" };
  return callRpc("get_ticket", { p_public_code: parsed.data }, ticketViewSchema);
}

export async function getStaffDesk(counterId: string | null) {
  const id = counterId ? uuidSchema.safeParse(counterId) : null;
  if (id && !id.success) return { ok: false as const, error: "counter_unavailable" };
  return callRpc(
    "get_staff_desk",
    { p_counter_id: id?.success ? id.data : null },
    deskSchema,
  );
}

export async function getHistory(date: string | null, counterId: string | null) {
  const parsedDate = date ? dateSchema.safeParse(date) : null;
  if (parsedDate && !parsedDate.success) return { ok: false as const, error: "invalid_status" };
  const parsedCounter = counterId ? uuidSchema.safeParse(counterId) : null;
  if (parsedCounter && !parsedCounter.success) {
    return { ok: false as const, error: "counter_unavailable" };
  }

  return callRpc(
    "get_history",
    {
      p_date: parsedDate?.success ? parsedDate.data : null,
      p_counter_id: parsedCounter?.success ? parsedCounter.data : null,
    },
    historySchema,
  );
}

export async function getCurrentStaff(): Promise<
  { ok: true; fullName: string; role: string; email: string } | RpcError
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "unauthorized" };

  return {
    ok: true,
    fullName: data.full_name,
    role: data.role,
    email: user.email ?? "",
  };
}
