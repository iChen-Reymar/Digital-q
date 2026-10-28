"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { messageFor } from "@/lib/messages";
import { deleteCounter, saveCounter } from "@/server/actions";
import type { CounterSummary } from "@/types/queue";

type Draft = {
  id: string | null;
  name: string;
  code: string;
  location: string;
  avgMinutes: string;
  isActive: boolean;
};

const emptyDraft: Draft = {
  id: null,
  name: "",
  code: "",
  location: "",
  avgMinutes: "3",
  isActive: true,
};

function draftFrom(counter: CounterSummary): Draft {
  return {
    id: counter.id,
    name: counter.name,
    code: counter.code,
    location: counter.location,
    avgMinutes: String(Math.round(counter.avg_service_seconds / 60)),
    isActive: counter.is_active,
  };
}

export function CounterManager({ counters }: { counters: CounterSummary[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: Draft = draft) {
    setError(null);
    startTransition(async () => {
      const result = await saveCounter({
        id: next.id,
        name: next.name,
        code: next.code,
        location: next.location,
        avgMinutes: next.avgMinutes,
        isActive: next.isActive,
      });
      if (!result.ok) {
        setError(result.message ?? messageFor(result.error));
        return;
      }
      setDraft(emptyDraft);
      router.refresh();
    });
  }

  function remove(counter: CounterSummary) {
    if (!window.confirm(`Delete ${counter.name}? This only works when the counter has no queue history.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCounter(counter.id);
      if (!result.ok) {
        setError(result.message ?? messageFor(result.error));
        return;
      }
      if (draft.id === counter.id) setDraft(emptyDraft);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <form
        className="panel px-5 py-6"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <h2 className="font-display text-3xl">{draft.id ? "Edit counter" : "Add a counter"}</h2>
        <label className="mt-4 block">
          <span className="field-label">Name</span>
          <input
            className="field"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            required
            minLength={3}
            maxLength={80}
          />
        </label>
        <label className="mt-4 block">
          <span className="field-label">Code</span>
          <input
            className="field uppercase"
            value={draft.code}
            onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })}
            required
            minLength={2}
            maxLength={6}
            pattern="[A-Za-z0-9]{2,6}"
          />
        </label>
        <label className="mt-4 block">
          <span className="field-label">Location</span>
          <input
            className="field"
            value={draft.location}
            onChange={(event) => setDraft({ ...draft, location: event.target.value })}
            required
            minLength={3}
            maxLength={120}
          />
        </label>
        <label className="mt-4 block">
          <span className="field-label">Usual service, minutes</span>
          <input
            className="field"
            type="number"
            min={1}
            max={60}
            value={draft.avgMinutes}
            onChange={(event) => setDraft({ ...draft, avgMinutes: event.target.value })}
            required
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
          />
          Active on the public board
        </label>
        {error ? (
          <p className="alert mt-4" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button className="btn btn-ink" type="submit" disabled={pending}>
            {pending ? "Saving…" : draft.id ? "Save changes" : "Add counter"}
          </button>
          {draft.id ? (
            <button className="btn btn-line" type="button" onClick={() => setDraft(emptyDraft)}>
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="panel overflow-x-auto px-5 py-6">
        <h2 className="font-display text-3xl">Counters</h2>
        {counters.length === 0 ? <p className="mt-3 text-sm text-muted">No counters yet.</p> : null}
        <ul className="mt-4 divide-y divide-line">
          {counters.map((counter) => (
            <li key={counter.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div>
                <p className="font-semibold">
                  {counter.name}{" "}
                  <span className="font-mono text-xs text-muted">{counter.code}</span>
                </p>
                <p className="text-sm text-muted">{counter.location}</p>
                <p className="mt-1 text-sm">
                  {Math.round(counter.avg_service_seconds / 60)} min usual service ·{" "}
                  {counter.is_active ? "Active" : "Inactive"} · {counter.waiting_count} waiting
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-line" onClick={() => setDraft(draftFrom(counter))}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-line"
                  disabled={pending}
                  onClick={() => save({ ...draftFrom(counter), isActive: !counter.is_active })}
                >
                  {counter.is_active ? "Deactivate" : "Activate"}
                </button>
                <button type="button" className="btn btn-stamp" disabled={pending} onClick={() => remove(counter)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
