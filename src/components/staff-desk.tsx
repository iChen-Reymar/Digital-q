"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { StatusStamp } from "@/components/status-stamp";
import { StatStrip } from "@/components/stat-strip";
import { cx } from "@/lib/cx";
import { formatTicketNumber, formatWhen, queueStatusLabel, servingCaption } from "@/lib/format";
import { messageFor } from "@/lib/messages";
import { usePoll } from "@/lib/use-poll";
import { callNext, cancelTicket, markServed, setQueueStatus, skipTicket } from "@/server/actions";
import { deskSchema, type ActionResult, type DeskPayload } from "@/types/queue";

export function StaffDesk({ initial }: { initial: DeskPayload }) {
  const [desk, setDesk] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reload = useCallback(async () => {
    const query = desk.counter_id ? `?counter=${desk.counter_id}` : "";
    const response = await fetch(`/api/staff/desk${query}`, { cache: "no-store" });
    if (response.status === 401) {
      window.location.href = "/staff/login";
      return;
    }
    const parsed = deskSchema.safeParse(await response.json());
    if (parsed.success) setDesk(parsed.data);
  }, [desk.counter_id]);

  usePoll(reload, 4000);

  function run(task: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/staff/login";
          return;
        }
        setError(result.message ?? messageFor(result.error));
        return;
      }
      await reload();
    });
  }

  const selected = desk.counters.find((counter) => counter.id === desk.counter_id) ?? null;
  const queueId = desk.queue_id;
  const called = desk.tickets.find((ticket) => ticket.status === "called") ?? null;
  const waiting = desk.tickets.filter((ticket) => ticket.status === "waiting");
  const finished = desk.tickets.filter((ticket) => ticket.status !== "waiting" && ticket.status !== "called");

  if (!selected || !desk.counter_id) {
    return (
      <section className="panel px-5 py-8">
        <h1 className="font-display text-4xl">No counters yet</h1>
        <p className="mt-2 text-muted">Add a service counter before calling numbers.</p>
        <Link href="/staff/counters" className="btn btn-ink mt-5">
          Manage counters
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {desk.counters.map((counter) => (
          <Link
            key={counter.id}
            href={`/staff?counter=${counter.id}`}
            className={cx("btn", counter.id === selected.id ? "btn-ink" : "btn-line")}
            aria-current={counter.id === selected.id ? "page" : undefined}
          >
            {counter.code}
            {!counter.is_active ? " · off" : ""}
          </Link>
        ))}
      </div>

      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="panel px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">{selected.location}</p>
              <h1 className="mt-1 font-display text-4xl">{selected.name}</h1>
            </div>
            <p className="text-sm font-semibold">{queueStatusLabel(desk.queue_status)}</p>
          </div>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            {servingCaption(selected.serving_state)}
          </p>
          <p className="queue-number mt-2 text-8xl sm:text-9xl">{formatTicketNumber(selected.now_serving)}</p>
          {called ? (
            <p className="mt-3 text-lg">
              {called.customer_name ?? "No name"} · {called.purpose}
            </p>
          ) : (
            <p className="mt-3 text-muted">
              {desk.queue_id ? "Nobody is at the window." : "Today's queue has not been opened."}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-ink"
              disabled={pending || !queueId || Boolean(called) || waiting.length === 0}
              onClick={() => {
                if (queueId) run(() => callNext(queueId));
              }}
            >
              Call next
            </button>
            <button
              type="button"
              className="btn btn-good"
              disabled={pending || !called}
              onClick={() => called && run(() => markServed(called.id))}
            >
              Mark served
            </button>
            <button
              type="button"
              className="btn btn-line"
              disabled={pending || !called}
              onClick={() => called && run(() => skipTicket(called.id))}
            >
              Skip
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["open", "paused", "closed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                className={cx("btn", desk.queue_status === status ? "btn-ink" : "btn-line")}
                disabled={pending}
                onClick={() => run(() => setQueueStatus(selected.id, status))}
              >
                {queueStatusLabel(status)}
              </button>
            ))}
          </div>
          {desk.queue_status === "paused" || desk.queue_status === "closed" ? (
            <p className="mt-3 text-sm text-muted">
              New tickets are stopped. You can still finish the people already waiting.
            </p>
          ) : null}
        </div>

        <div className="panel px-5 py-6">
          <h2 className="font-display text-3xl">Waiting · {waiting.length}</h2>
          {waiting.length === 0 ? (
            <p className="mt-3 text-sm text-muted">The waiting list is empty.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {waiting.map((ticket) => (
                <li key={ticket.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-display text-3xl leading-none">{formatTicketNumber(ticket.ticket_number)}</p>
                    <p className="mt-1 text-sm">{ticket.customer_name ?? "No name"}</p>
                    <p className="text-sm text-muted">
                      {ticket.purpose} · {formatWhen(ticket.issued_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-stamp"
                    disabled={pending}
                    onClick={() => run(() => cancelTicket(ticket.id))}
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <StatStrip stats={desk.stats} />

      {finished.length > 0 ? (
        <details className="panel px-5 py-4">
          <summary className="cursor-pointer font-semibold">Earlier numbers today</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Called</th>
                </tr>
              </thead>
              <tbody>
                {finished.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="font-display text-2xl">{formatTicketNumber(ticket.ticket_number)}</td>
                    <td>{ticket.customer_name ?? "—"}</td>
                    <td>{ticket.purpose}</td>
                    <td>
                      <StatusStamp status={ticket.status} />
                    </td>
                    <td>{formatWhen(ticket.called_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
