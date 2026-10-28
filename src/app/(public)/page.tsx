import { TicketForm } from "@/components/ticket-form";
import { SetupNotice } from "@/components/setup-notice";
import { messageFor } from "@/lib/messages";
import { listPublicCounters } from "@/server/queries";

export default async function HomePage() {
  try {
    const result = await listPublicCounters();
    if (!result.ok) return <SetupNotice detail={messageFor(result.error)} />;
    return <TicketForm initialCounters={result.counters} />;
  } catch {
    return <SetupNotice />;
  }
}
