import { formatMinutes } from "@/lib/format";
import type { DailyStats } from "@/types/queue";

const ITEMS = [
  ["Issued", "issued"],
  ["Waiting", "waiting"],
  ["Called", "called"],
  ["Served", "served"],
  ["Skipped", "skipped"],
  ["Cancelled", "cancelled"],
] as const;

export function StatStrip({ stats }: { stats: DailyStats }) {
  const finished = stats.served + stats.skipped + stats.cancelled;

  return (
    <section>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ITEMS.map(([label, key]) => (
          <div key={key} className="panel px-3 py-3">
            <dt className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted">{label}</dt>
            <dd className="mt-1 font-display text-4xl">{stats[key]}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">
        Average wait {formatMinutes(stats.avg_wait_seconds)} · average service{" "}
        {formatMinutes(stats.avg_service_seconds)}
      </p>
      {finished > 0 ? (
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="bg-serving" style={{ width: `${(stats.served / finished) * 100}%` }} />
          <div className="bg-gold" style={{ width: `${(stats.skipped / finished) * 100}%` }} />
          <div className="bg-stamp" style={{ width: `${(stats.cancelled / finished) * 100}%` }} />
        </div>
      ) : null}
    </section>
  );
}
