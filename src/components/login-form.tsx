"use client";

import { useActionState } from "react";
import { signIn } from "@/server/actions";

export function LoginForm({ nextPath, notice }: { nextPath: string; notice?: string }) {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      {notice ? <p className="alert">{notice}</p> : null}
      <label className="block">
        <span className="field-label">Email</span>
        <input className="field" name="email" type="email" autoComplete="username" required maxLength={120} />
      </label>
      <label className="block">
        <span className="field-label">Password</span>
        <input
          className="field"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
        />
      </label>
      {state?.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="btn btn-ink w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-muted">The local staff account is listed in the README. Signup is turned off.</p>
    </form>
  );
}
