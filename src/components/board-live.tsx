"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { formatTicketNumber, queueStatusLabel, servingCaption } from "@/lib/format";
import { usePoll } from "@/lib/use-poll";
import { boardSchema, type CounterSummary } from "@/types/queue";

function startingCounter(counters: CounterSummary[]) {
  return (
    counters.find((counter) => counter.serving_state === "serving" || counter.waiting_count > 0)?.id ??
    counters.find((counter) => counter.queue_status === "open")?.id ??
    counters[0]?.id ??
    ""
  );
}

export function BoardLive({ initialCounters }: { initialCounters: CounterSummary[] }) {
  const [counters, setCounters] = useState(initialCounters);
  const [selected, setSelected] = useState(() => startingCounter(initialCounters));
  const [clock, setClock] = useState("");

  const reload = useCallback(async () => {
    if (!selected) return;
    const response = await fetch(`/api/board?counter=${selected}`, { cache: "no-store" });
    if (!response.ok) return;
    const parsed = boardSchema.safeParse(await response.json());
    if (!parsed.success) return;
    setCounters((current) => current.map((counter) => (counter.id === parsed.data.id ? parsed.data : counter)));
  }, [selected]);

  usePoll(reload, 4000);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const paint = () => {
      setClock(
        new Intl.DateTimeFormat("en-PH", {
          timeZone: "Asia/Manila",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    };
    paint();
    const timer = window.setInterval(paint, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const current = counters.find((counter) => counter.id === selected) ?? counters[0];

  function fullscreen() {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }

  if (!current) {
    return (
      <main className="board-screen flex min-h-screen items-center justify-center px-6">
        <p>No counters are on the board.</p>
      </main>
    );
  }

  return (
    <main className="board-screen flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div>
          <p className="font-display text-2xl italic">Numera</p>
          <p className="text-xs uppercase tracking-[0.16em] text-[#d9cbb6]">Live queue board</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {counters.map((counter) => (
            <button
              key={counter.id}
              type="button"
              className={cx("btn", counter.id === current.id ? "btn-ink !bg-[#f3eee4] !text-ink" : "btn-ghost")}
              onClick={() => setSelected(counter.id)}
            >
              {counter.code}
            </button>
          ))}
          <button type="button" className="btn btn-ghost" onClick={fullscreen}>
            Full screen
          </button>
          <Link href="/" className="btn btn-ghost">
            Exit
          </Link>
        </div>
      </header>

      <section className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10" aria-live="polite">
        <p className="text-sm uppercase tracking-[0.2em] text-[#d9cbb6]">{current.name}</p>
        <p className="mt-1 text-sm text-[#d9cbb6]">{current.location}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-gold">
          {servingCaption(current.serving_state)} · {queueStatusLabel(current.queue_status)}
        </p>
        <p className="queue-number mt-4 text-[6.5rem] text-[#fffaf3] sm:text-[10rem]">
          {formatTicketNumber(current.now_serving)}
        </p>
        {current.serving_state === "between" ? (
          <p className="mt-2 max-w-lg text-lg text-[#d9cbb6]">The window is between numbers.</p>
        ) : null}
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.16em] text-[#d9cbb6]">
            Next up · {current.waiting_count} waiting
          </p>
          <p className="mt-3 flex flex-wrap gap-3 font-display text-4xl sm:text-5xl">
            {current.upcoming.length === 0
              ? "—"
              : current.upcoming.map((number) => (
                  <span key={number}>{formatTicketNumber(number)}</span>
                ))}
          </p>
        </div>
      </section>

      <footer className="flex justify-end px-5 py-4 text-sm text-[#d9cbb6] sm:px-8">
        <span>{clock}</span>
      </footer>
    </main>
  );
}
