import { CounterManager } from "@/components/counter-manager";
import { SetupNotice } from "@/components/setup-notice";
import { messageFor } from "@/lib/messages";
import { getStaffDesk } from "@/server/queries";

export const metadata = { title: "Counters" };

export default async function CountersPage() {
  try {
    const result = await getStaffDesk(null);
    if (!result.ok) return <SetupNotice detail={messageFor(result.error)} />;

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Setup</p>
          <h1 className="mt-1 font-display text-5xl">Service counters</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Create, edit, pause from the desk, or deactivate a window. Deleting is blocked once a counter has queue history, so the daily record stays intact.
          </p>
        </div>
        <CounterManager counters={result.counters} />
      </div>
    );
  } catch {
    return <SetupNotice />;
  }
}
