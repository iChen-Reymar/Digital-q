export function SetupNotice({ detail }: { detail?: string }) {
  return (
    <section className="mx-auto max-w-xl py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Connection</p>
      <h1 className="mt-2 font-display text-4xl">
        {detail ? "The queue database is not ready" : "Supabase is not connected"}
      </h1>
      <p className="mt-3 text-muted">
        {detail ?? "Add the Supabase URL and publishable key to .env, then start the app again."}
      </p>
      {detail ? (
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Open the SQL editor for this project in the Supabase dashboard.</li>
          <li>
            Run <code className="font-mono">supabase/migrations/20261028120000_queue.sql</code>.
          </li>
          <li>
            Run <code className="font-mono">supabase/seed.sql</code> if you want the demo tickets.
          </li>
          <li>Refresh this page.</li>
        </ol>
      ) : (
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            Put <code className="font-mono">VITE_SUPABASE_URL</code> and{" "}
            <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
            <code className="font-mono">.env</code>.
          </li>
          <li>
            Run <code className="font-mono">npm run dev</code> again so Next.js loads the new values.
          </li>
        </ol>
      )}
    </section>
  );
}
