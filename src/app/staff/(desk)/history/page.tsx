import { StatStrip } from "@/components/stat-strip";
import { StatusStamp } from "@/components/status-stamp";
import { SetupNotice } from "@/components/setup-notice";
import { campusTodayISO, formatMinutes, formatWhen } from "@/lib/format";
import { messageFor } from "@/lib/messages";
import { getHistory } from "@/server/queries";

export const metadata = { title: "Queue history" };

function elapsed(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const seconds = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (seconds < 0) return "—";
  return formatMinutes(seconds);
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; counter?: string }>;
}) {
  const params = await searchParams;
  const requestedDate = params.date || campusTodayISO();

  try {
    const result = await getHistory(requestedDate, params.counter || null);
    if (!result.ok) return <SetupNotice detail={messageFor(result.error)} />;

    const dateValue = result.service_date.slice(0, 10);

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Records</p>
          <h1 className="mt-1 font-display text-5xl">Queue history</h1>
        </div>

        <form className="flex flex-wrap items-end gap-3" method="get">
          <label>
            <span className="field-label">Date</span>
            <input className="field" type="date" name="date" defaultValue={dateValue} />
          </label>
          <label>
            <span className="field-label">Counter</span>
            <select className="field" name="counter" defaultValue={params.counter ?? ""}>
              <option value="">All counters</option>
              {result.counters.map((counter) => (
                <option key={counter.id} value={counter.id}>
                  {counter.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-ink" type="submit">
            Show
          </button>
        </form>

        <StatStrip stats={result.stats} />

        {result.tickets.length === 0 ? (
          <p className="text-muted">No tickets for this day.</p>
        ) : (
          <div className="panel overflow-x-auto px-4 py-3">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Counter</th>
                  <th>Name</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Called</th>
                  <th>Wait</th>
                  <th>Service</th>
                </tr>
              </thead>
              <tbody>
                {result.tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="font-display text-2xl">{String(ticket.ticket_number).padStart(3, "0")}</td>
                    <td>{ticket.counter_code}</td>
                    <td>{ticket.customer_name ?? "—"}</td>
                    <td>{ticket.purpose}</td>
                    <td>
                      <StatusStamp status={ticket.status} />
                    </td>
                    <td>{formatWhen(ticket.issued_at)}</td>
                    <td>{formatWhen(ticket.called_at)}</td>
                    <td>{elapsed(ticket.issued_at, ticket.called_at)}</td>
                    <td>{elapsed(ticket.called_at, ticket.served_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } catch {
    return <SetupNotice />;
  }
}
