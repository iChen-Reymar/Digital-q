"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CLIENT_KEY, LAST_TICKET, PURPOSES } from "@/lib/constants";
import { cx } from "@/lib/cx";
import { formatTicketNumber, queueStatusLabel, servingCaption } from "@/lib/format";
import { usePoll } from "@/lib/use-poll";
import { issueTicket } from "@/server/actions";
import { counterListSchema, type CounterSummary } from "@/types/queue";

export function TicketForm({ initialCounters }: { initialCounters: CounterSummary[] }) {
  const [counters, setCounters] = useState(initialCounters);
  const [selected, setSelected] = useState(
    initialCounters.find((counter) => counter.queue_status === "open")?.id ?? initialCounters[0]?.id ?? "",
  );
  const [clientKey, setClientKey] = useState("");
  const [lastTicket, setLastTicket] = useState<string | null>(null);
  const [state, action, pending] = useActionState(issueTicket, null);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(CLIENT_KEY);
      if (existing) {
        setClientKey(existing);
      } else {
        const created = crypto.randomUUID();
        localStorage.setItem(CLIENT_KEY, created);
        setClientKey(created);
      }
      setLastTicket(localStorage.getItem(LAST_TICKET));
    } catch {
      setClientKey("");
    }
  }, []);

  const reload = useCallback(async () => {
    const response = await fetch("/api/counters", { cache: "no-store" });
    if (!response.ok) return;
    const parsed = counterListSchema.safeParse(await response.json());
    if (parsed.success) setCounters(parsed.data.counters);
  }, []);

  usePoll(reload, 5000);

  const current = counters.find((counter) => counter.id === selected) ?? counters[0];
  const intakeOpen = current && (current.queue_status === "open" || current.queue_status === "not_open");

  if (!current) {
    return <p className="text-muted">No counters are accepting tickets right now.</p>;
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Registrar queue</p>
        <h1 className="mt-2 max-w-md font-display text-5xl leading-[0.95] sm:text-6xl">
          Take a number. Leave the line.
        </h1>
        <p className="mt-4 max-w-md text-lg leading-7 text-muted">
          Get a queue ticket, then watch your place and an estimated wait from anywhere on campus.
        </p>

        <div className="panel mt-8 px-5 py-6" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                {servingCaption(current.serving_state)}
              </p>
              <p className="mt-1 text-sm">{current.name}</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-gold">
              {queueStatusLabel(current.queue_status)}
            </span>
          </div>
          <p className="queue-number mt-4 text-7xl sm:text-8xl">{formatTicketNumber(current.now_serving)}</p>
          <p className="mt-4 text-sm text-muted">
            {current.waiting_count} waiting
            {current.upcoming.length > 0 ? ` · next ${current.upcoming.map((n) => formatTicketNumber(n)).join(", ")}` : ""}
          </p>
        </div>

        {lastTicket ? (
          <p className="mt-4 text-sm">
            <Link href={`/ticket/${lastTicket}`} className="underline decoration-line underline-offset-4">
              Open the last ticket viewed on this browser
            </Link>
          </p>
        ) : null}
      </section>

      <form action={action} className="panel px-5 py-6 sm:px-6">
        <h2 className="font-display text-3xl">Get a queue ticket</h2>
        <p className="mt-1 text-sm text-muted">One active ticket per browser, per counter, for today.</p>

        <fieldset className="mt-5">
          <legend className="field-label">Counter</legend>
          <div className="grid gap-2">
            {counters.map((counter) => (
              <label key={counter.id} className="choice">
                <input
                  className="sr-only"
                  type="radio"
                  name="counter_id"
                  value={counter.id}
                  checked={counter.id === current.id}
                  onChange={() => setSelected(counter.id)}
                />
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{counter.name}</span>
                  <span className="font-mono text-xs text-muted">{counter.code}</span>
                </span>
                <span className="mt-1 block text-sm text-muted">{counter.location}</span>
                <span className="mt-2 block text-sm">
                  {counter.now_serving == null ? "No one serving" : `${formatTicketNumber(counter.now_serving)} serving`}
                  {" · "}
                  {counter.waiting_count} waiting · {queueStatusLabel(counter.queue_status)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-5 block">
          <span className="field-label">Name, optional</span>
          <input className="field" name="customer_name" maxLength={80} autoComplete="name" placeholder="Maya Santos" />
        </label>

        <label className="mt-4 block">
          <span className="field-label">Service</span>
          <select className="field" name="purpose" defaultValue="" required>
            <option value="" disabled>
              Choose a service
            </option>
            {PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </label>

        <input type="hidden" name="client_key" value={clientKey} />

        {state && !state.ok ? (
          <p className="alert mt-4" role="alert">
            {state.message}
          </p>
        ) : null}

        {!intakeOpen ? (
          <p className="alert mt-4">
            {current.name} is {queueStatusLabel(current.queue_status).toLowerCase()}. Choose another counter.
          </p>
        ) : null}

        <button className={cx("btn btn-ink mt-5 w-full")} type="submit" disabled={pending || !clientKey || !intakeOpen}>
          {pending ? "Issuing ticket…" : "Get queue ticket"}
        </button>
        <p className="mt-3 text-sm text-muted">
          The estimate is people ahead × the average service time. It updates while you wait.
        </p>
      </form>
    </div>
  );
}
