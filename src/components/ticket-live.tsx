"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CLIENT_KEY, LAST_TICKET } from "@/lib/constants";
import { cx } from "@/lib/cx";
import {
  estimateNote,
  formatClock,
  formatTicketNumber,
  peopleAheadLabel,
  servingCaption,
  statusLabel,
  waitLabel,
} from "@/lib/format";
import { messageFor } from "@/lib/messages";
import { usePoll } from "@/lib/use-poll";
import { cancelMyTicket } from "@/server/actions";
import { ticketViewSchema, type TicketStatus, type TicketView } from "@/types/queue";
import { StatusStamp } from "@/components/status-stamp";

const STEPS = ["Issued", "Waiting", "Called", "Served"] as const;

function stepIndex(status: TicketStatus) {
  if (status === "waiting") return 1;
  if (status === "called") return 2;
  if (status === "served") return 3;
  return -1;
}

export function TicketLive({ initial, notice }: { initial: TicketView; notice: boolean }) {
  const [ticket, setTicket] = useState(initial);
  const [clientKey, setClientKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = stepIndex(ticket.status);

  useEffect(() => {
    try {
      setClientKey(localStorage.getItem(CLIENT_KEY));
      localStorage.setItem(LAST_TICKET, initial.public_code);
    } catch {
      setClientKey(null);
    }
  }, [initial.public_code]);

  const reload = useCallback(async () => {
    const response = await fetch(`/api/tickets/${initial.public_code}`, { cache: "no-store" });
    if (!response.ok) return;
    const parsed = ticketViewSchema.safeParse(await response.json());
    if (parsed.success) setTicket(parsed.data);
  }, [initial.public_code]);

  usePoll(reload);

  function cancel() {
    if (!clientKey) {
      setError(messageFor("not_owner"));
      return;
    }
    startTransition(async () => {
      const result = await cancelMyTicket(ticket.public_code, clientKey);
      if (!result.ok) {
        setError(result.message ?? messageFor(result.error));
        return;
      }
      setError(null);
      await reload();
    });
  }

  const ahead = peopleAheadLabel(ticket.people_ahead, ticket.status);
  const wait = waitLabel(ticket.estimated_wait_seconds, ticket.people_ahead, ticket.status);

  return (
    <article className="mx-auto max-w-xl">
      {notice ? (
        <p className="alert mb-4">You already had an active ticket, so this is the same number.</p>
      ) : null}

      <div className={cx("ticket-shell px-6 py-7 sm:px-8", ticket.status === "called" && "called-banner")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-xl italic">Numera</p>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{ticket.counter_code}</p>
          </div>
          <StatusStamp status={ticket.status} />
        </div>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-muted">Queue number</p>
        <p className="queue-number mt-2 text-8xl sm:text-9xl">{formatTicketNumber(ticket.ticket_number)}</p>
        <h1 className="sr-only">
          Queue number {ticket.ticket_number}, {statusLabel(ticket.status)}
        </h1>

        <div className="mt-6 border-t border-dashed border-line pt-5">
          <p className="text-lg">{ticket.counter_name}</p>
          <p className="text-sm text-muted">{ticket.counter_location}</p>
          <p className="mt-2 text-sm">
            {ticket.purpose}
            {ticket.customer_name ? ` · ${ticket.customer_name}` : ""} · issued {formatClock(ticket.issued_at)}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-live="polite">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              {servingCaption(ticket.serving_state)}
            </p>
            <p className="mt-1 font-display text-3xl">{formatTicketNumber(ticket.now_serving)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Your place</p>
            <p className="mt-1 text-lg leading-6">{ahead ?? statusLabel(ticket.status)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Est. wait</p>
            <p className="mt-1 text-lg leading-6">{wait ?? "—"}</p>
          </div>
        </div>

        {ticket.status === "waiting" || ticket.status === "called" ? (
          <p className="mt-4 text-sm text-muted">
            Wait estimate = people ahead × average service time.{" "}
            {estimateNote(ticket.avg_source, ticket.avg_sample_size, ticket.avg_service_seconds)}
          </p>
        ) : null}

        {ticket.status === "called" ? (
          <p className="mt-4 rounded-md bg-[#e7f4ec] px-3 py-3 text-[#145c38]">
            Your number has been called. Go to {ticket.counter_location}.
          </p>
        ) : null}
        {ticket.status === "served" ? (
          <p className="mt-4 text-sm text-muted">This visit is complete. Thank you.</p>
        ) : null}
        {ticket.status === "skipped" ? (
          <p className="mt-4 text-sm text-muted">This number was skipped. Get a new ticket if you still need the counter.</p>
        ) : null}
        {ticket.status === "cancelled" ? <p className="mt-4 text-sm text-muted">This ticket was cancelled.</p> : null}

        {active >= 0 ? (
          <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-[0.7rem] font-bold uppercase tracking-[0.08em]">
            {STEPS.map((step, index) => (
              <li key={step} className={index <= active ? "text-ink" : "text-line"}>
                <span
                  className={cx(
                    "mx-auto mb-1 block h-1.5 rounded-full",
                    index <= active ? "bg-ink" : "bg-line",
                  )}
                />
                {step}
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {ticket.status === "waiting" ? (
          <button className="btn btn-stamp" type="button" onClick={cancel} disabled={pending}>
            {pending ? "Cancelling…" : "Cancel ticket"}
          </button>
        ) : null}
        <Link href="/board" className="btn btn-line">
          Open the live board
        </Link>
        <Link href="/" className="text-sm underline decoration-line underline-offset-4">
          Back to counters
        </Link>
      </div>
      {error ? (
        <p className="alert mt-4" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted">Code {ticket.public_code} · updates every few seconds</p>
    </article>
  );
}
