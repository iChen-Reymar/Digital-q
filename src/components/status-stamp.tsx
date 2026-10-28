import { statusLabel } from "@/lib/format";
import { cx } from "@/lib/cx";
import type { TicketStatus } from "@/types/queue";

export function StatusStamp({ status }: { status: TicketStatus }) {
  const tone =
    status === "called" ? "text-serving" : status === "waiting" ? "text-stamp" : "text-muted";

  return <span className={cx("stamp", tone)}>{statusLabel(status)}</span>;
}
