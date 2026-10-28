const MESSAGES: Record<string, string> = {
  counter_unavailable: "That counter is not taking tickets right now.",
  queue_closed: "This queue is closed for today.",
  queue_paused: "Ticket intake is paused at this counter.",
  active_ticket: "You already have an active ticket at this counter.",
  duplicate_name: "That name already has an active ticket at this counter today.",
  invalid_name: "Use 2–80 letters, spaces, apostrophes, or hyphens.",
  invalid_purpose: "Choose a service from the list.",
  invalid_client: "Refresh the page so this browser can hold a ticket.",
  not_waiting: "Only a waiting ticket can be cancelled here.",
  already_called: "This number has been called. Please go to the counter.",
  not_found: "No ticket matches that code.",
  not_owner: "This ticket can only be cancelled from the browser that created it.",
  unauthorized: "Your staff session expired. Sign in again.",
  nothing_waiting: "No one is waiting.",
  already_calling: "Serve or skip the current number before calling the next one.",
  not_called: "Call a number before marking it served or skipped.",
  not_cancellable: "That ticket can no longer be cancelled.",
  invalid_status: "Choose open, paused, or closed.",
  invalid_counter: "Check the counter name, code, location, and service time.",
  code_taken: "That counter code is already in use.",
  counter_in_use: "This counter has queue history. Deactivate it instead of deleting it.",
  queue_not_found: "Open today's queue before calling a number.",
  duplicate_ticket: "The ticket could not be issued. Try again.",
  request_failed:
    "The project answered, but the queue functions are missing. Run the migration in the Supabase SQL editor.",
  no_counters: "Add a counter before opening the desk.",
};

export function messageFor(error: string | undefined) {
  if (!error) return MESSAGES.request_failed;
  return MESSAGES[error] ?? "The queue could not complete that action.";
}
