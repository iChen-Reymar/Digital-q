import { z } from "zod";
import { QUEUE_STATUSES, SERVING_STATES, TICKET_STATUSES } from "@/lib/constants";

const int = z.number().int();

export const statsSchema = z.object({
  issued: int,
  waiting: int,
  called: int,
  served: int,
  skipped: int,
  cancelled: int,
  avg_service_seconds: int.nullable(),
  avg_wait_seconds: int.nullable(),
});

export const counterSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  location: z.string(),
  is_active: z.boolean(),
  avg_service_seconds: int,
  queue_id: z.string().uuid().nullable(),
  queue_status: z.enum(QUEUE_STATUSES),
  now_serving: int.nullable(),
  serving_state: z.enum(SERVING_STATES),
  waiting_count: int,
  upcoming: z.array(int),
  effective_avg_service_seconds: int,
  avg_sample_size: int,
  avg_source: z.enum(["observed", "counter_default"]),
});

export const counterListSchema = z.object({
  ok: z.literal(true),
  counters: z.array(counterSchema),
});

export const boardSchema = counterSchema.extend({
  ok: z.literal(true),
});

export const ticketViewSchema = z.object({
  ok: z.literal(true),
  public_code: z.string(),
  ticket_number: int,
  status: z.enum(TICKET_STATUSES),
  customer_name: z.string().nullable(),
  purpose: z.string(),
  issued_at: z.string(),
  called_at: z.string().nullable(),
  served_at: z.string().nullable(),
  counter_id: z.string().uuid(),
  counter_name: z.string(),
  counter_code: z.string(),
  counter_location: z.string(),
  queue_status: z.enum(["open", "paused", "closed"]),
  people_ahead: int.nullable(),
  estimated_wait_seconds: int.nullable(),
  avg_service_seconds: int,
  avg_sample_size: int,
  avg_source: z.enum(["observed", "counter_default"]),
  now_serving: int.nullable(),
  serving_state: z.enum(SERVING_STATES),
  waiting_count: int,
});

export const ticketRowSchema = z.object({
  id: z.string().uuid(),
  ticket_number: int,
  public_code: z.string(),
  customer_name: z.string().nullable(),
  purpose: z.string(),
  status: z.enum(TICKET_STATUSES),
  issued_at: z.string(),
  called_at: z.string().nullable(),
  served_at: z.string().nullable(),
  closed_at: z.string().nullable(),
});

export const historyTicketSchema = ticketRowSchema.extend({
  counter_name: z.string(),
  counter_code: z.string(),
});

export const deskSchema = z.object({
  ok: z.literal(true),
  counter_id: z.string().uuid().nullable(),
  queue_id: z.string().uuid().nullable(),
  queue_status: z.enum(QUEUE_STATUSES),
  counters: z.array(counterSchema),
  tickets: z.array(ticketRowSchema),
  stats: statsSchema,
});

export const historySchema = z.object({
  ok: z.literal(true),
  service_date: z.string(),
  counters: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
  })),
  stats: statsSchema,
  tickets: z.array(historyTicketSchema),
});

export const okSchema = z.object({
  ok: z.literal(true),
});

export const saveCounterSchema = z.object({
  ok: z.literal(true),
  id: z.string().uuid(),
});

export const errorSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  public_code: z.string().optional(),
});

export type DailyStats = z.infer<typeof statsSchema>;
export type CounterSummary = z.infer<typeof counterSchema>;
export type TicketView = z.infer<typeof ticketViewSchema>;
export type TicketRow = z.infer<typeof ticketRowSchema>;
export type HistoryTicket = z.infer<typeof historyTicketSchema>;
export type DeskPayload = z.infer<typeof deskSchema>;
export type HistoryPayload = z.infer<typeof historySchema>;
export type TicketStatus = TicketRow["status"];

export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  public_code?: string;
};

export type RpcError = z.infer<typeof errorSchema>;
