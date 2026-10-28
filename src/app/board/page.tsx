import { BoardLive } from "@/components/board-live";
import { SetupNotice } from "@/components/setup-notice";
import { messageFor } from "@/lib/messages";
import { listPublicCounters } from "@/server/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live board" };

export default async function BoardPage() {
  try {
    const result = await listPublicCounters();
    if (!result.ok) return <SetupNotice detail={messageFor(result.error)} />;
    return <BoardLive initialCounters={result.counters} />;
  } catch {
    return <SetupNotice />;
  }
}
