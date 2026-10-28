import type { TicketStatus } from "@/types/queue";

const CAMPUS_TIME_ZONE = "Asia/Manila";

export function campusTodayISO(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatClock(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: CAMPUS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return formatClock(iso);
}

export function formatTicketNumber(value: number | null) {
  if (value == null) return "—";
  return String(value).padStart(3, "0");
}

export function formatWait(seconds: number | null) {
  if (seconds == null) return "—";
  if (seconds < 60) return "Less than a minute";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `About ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `About ${hours} hour${hours === 1 ? "" : "s"}`;
  return `About ${hours} hr ${remainder} min`;
}

export function formatMinutes(seconds: number | null) {
  if (seconds == null) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "< 1 min";
  return `${minutes} min`;
}

export function peopleAheadLabel(count: number | null, status: TicketStatus) {
  if (status === "called") return "Please proceed to the counter";
  if (status !== "waiting" || count == null) return null;
  if (count === 0) return "You're next";
  if (count === 1) return "1 person ahead";
  return `${count} people ahead`;
}

export function waitLabel(
  seconds: number | null,
  peopleAhead: number | null,
  status: TicketStatus,
) {
  if (status !== "waiting") return null;
  if (peopleAhead === 0) return "Under a minute once the window is free";
  return formatWait(seconds);
}

export function estimateNote(source: "observed" | "counter_default", samples: number, seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (source === "observed") {
    return `Based on ${samples} completed visits today, about ${minutes} min each.`;
  }
  return `Based on this counter's usual service time of about ${minutes} min.`;
}

export function statusLabel(status: TicketStatus) {
  switch (status) {
    case "waiting":
      return "Waiting";
    case "called":
      return "Now called";
    case "served":
      return "Served";
    case "skipped":
      return "Skipped";
    case "cancelled":
      return "Cancelled";
  }
}

export function queueStatusLabel(status: string) {
  switch (status) {
    case "open":
      return "Open";
    case "paused":
      return "Paused";
    case "closed":
      return "Closed";
    default:
      return "Not open";
  }
}

export function servingCaption(state: string) {
  if (state === "serving") return "Now serving";
  if (state === "between") return "Last called";
  return "Now serving";
}
