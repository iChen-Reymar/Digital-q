export const PURPOSES = [
  "Enrollment",
  "Transcript",
  "Grades",
  "ID Replacement",
  "Clearance",
  "Other",
] as const;

export type Purpose = (typeof PURPOSES)[number];

export const CLIENT_KEY = "numera_client_key";
export const LAST_TICKET = "numera_last_ticket";

export const TICKET_STATUSES = [
  "waiting",
  "called",
  "served",
  "skipped",
  "cancelled",
] as const;

export const QUEUE_STATUSES = ["open", "paused", "closed", "not_open"] as const;
export const SERVING_STATES = ["idle", "serving", "between"] as const;
