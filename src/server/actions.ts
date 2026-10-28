"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { messageFor } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import {
  counterInputSchema,
  issueErrorCode,
  issueSchema,
  publicCodeSchema,
  uuidSchema,
} from "@/lib/validators";
import { callRpc } from "@/server/rpc";
import {
  okSchema,
  saveCounterSchema,
  ticketViewSchema,
  type ActionResult,
  type RpcError,
} from "@/types/queue";

function withMessage(
  result: { ok: true } | RpcError | { ok: false; error: string; public_code?: string },
): ActionResult {
  if (result.ok) return { ok: true };
  return {
    ok: false,
    error: result.error,
    message: messageFor(result.error),
    public_code: "public_code" in result ? result.public_code : undefined,
  };
}

function revalidateQueue() {
  revalidatePath("/", "layout");
}

function safeNext(value: string) {
  if (!/^\/staff(\/|$)/.test(value)) return "/staff";
  if (value.startsWith("/staff/login")) return "/staff";
  return value;
}

export type SignInState = { error?: string } | null;
export type IssueState = ActionResult | null;

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/staff"));

  if (!email || !password || email.length > 120 || password.length > 200) {
    return { error: "Enter the staff email and password." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Those staff credentials were not accepted." };
  } catch (error) {
    console.error(error);
    return { error: "Supabase is not running. Start Docker, then run npm run db:start." };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/staff/login");
}

export async function issueTicket(_prev: IssueState, formData: FormData): Promise<IssueState> {
  const parsed = issueSchema.safeParse({
    counter_id: formData.get("counter_id"),
    customer_name: String(formData.get("customer_name") ?? ""),
    purpose: formData.get("purpose"),
    client_key: formData.get("client_key"),
  });

  if (!parsed.success) {
    const error = issueErrorCode(parsed.error);
    return { ok: false, error, message: messageFor(error) };
  }

  let result;
  try {
    result = await callRpc(
      "issue_ticket",
      {
        p_counter_id: parsed.data.counter_id,
        p_customer_name: parsed.data.customer_name,
        p_purpose: parsed.data.purpose,
        p_client_key: parsed.data.client_key,
      },
      ticketViewSchema,
    );
  } catch (error) {
    console.error(error);
    return withMessage({ ok: false, error: "request_failed" });
  }

  if (result.ok) {
    revalidateQueue();
    redirect(`/ticket/${result.public_code}`);
  }

  if (result.error === "active_ticket" && result.public_code) {
    redirect(`/ticket/${result.public_code}?notice=active`);
  }

  return withMessage(result);
}

export async function cancelMyTicket(publicCode: string, clientKey: string): Promise<ActionResult> {
  const code = publicCodeSchema.safeParse(publicCode);
  const key = uuidSchema.safeParse(clientKey);
  if (!code.success || !key.success) return withMessage({ ok: false, error: "not_found" });

  try {
    const result = await callRpc(
      "cancel_my_ticket",
      { p_public_code: code.data, p_client_key: key.data },
      ticketViewSchema,
    );
    if (result.ok) revalidateQueue();
    return withMessage(result);
  } catch (error) {
    console.error(error);
    return withMessage({ ok: false, error: "request_failed" });
  }
}

async function staffMutation(fn: string, args: Record<string, unknown>): Promise<ActionResult> {
  try {
    const result = await callRpc(fn, args, okSchema);
    if (result.ok) revalidateQueue();
    return withMessage(result);
  } catch (error) {
    console.error(error);
    return withMessage({ ok: false, error: "request_failed" });
  }
}

export async function callNext(queueId: string) {
  const id = uuidSchema.safeParse(queueId);
  if (!id.success) return withMessage({ ok: false, error: "queue_not_found" });
  return staffMutation("call_next", { p_queue_id: id.data });
}

export async function markServed(ticketId: string) {
  const id = uuidSchema.safeParse(ticketId);
  if (!id.success) return withMessage({ ok: false, error: "not_found" });
  return staffMutation("mark_served", { p_ticket_id: id.data });
}

export async function skipTicket(ticketId: string) {
  const id = uuidSchema.safeParse(ticketId);
  if (!id.success) return withMessage({ ok: false, error: "not_found" });
  return staffMutation("skip_ticket", { p_ticket_id: id.data });
}

export async function cancelTicket(ticketId: string) {
  const id = uuidSchema.safeParse(ticketId);
  if (!id.success) return withMessage({ ok: false, error: "not_found" });
  return staffMutation("cancel_ticket", { p_ticket_id: id.data });
}

export async function setQueueStatus(counterId: string, status: "open" | "paused" | "closed") {
  const id = uuidSchema.safeParse(counterId);
  if (!id.success || !["open", "paused", "closed"].includes(status)) {
    return withMessage({ ok: false, error: "invalid_status" });
  }
  return staffMutation("set_counter_queue_status", {
    p_counter_id: id.data,
    p_status: status,
  });
}

export async function saveCounter(input: unknown): Promise<ActionResult> {
  const parsed = counterInputSchema.safeParse(input);
  if (!parsed.success) return withMessage({ ok: false, error: "invalid_counter" });

  try {
    const result = await callRpc(
      "save_counter",
      {
        p_id: parsed.data.id,
        p_name: parsed.data.name,
        p_code: parsed.data.code,
        p_location: parsed.data.location,
        p_avg_service_seconds: parsed.data.avgMinutes * 60,
        p_is_active: parsed.data.isActive,
      },
      saveCounterSchema,
    );
    if (result.ok) revalidateQueue();
    return withMessage(result);
  } catch (error) {
    console.error(error);
    return withMessage({ ok: false, error: "request_failed" });
  }
}

export async function deleteCounter(counterId: string) {
  const id = uuidSchema.safeParse(counterId);
  if (!id.success) return withMessage({ ok: false, error: "counter_unavailable" });
  return staffMutation("delete_counter", { p_id: id.data });
}
