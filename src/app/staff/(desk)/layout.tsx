import Link from "next/link";
import { signOut } from "@/server/actions";
import { getCurrentStaff } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function StaffDeskLayout({ children }: { children: React.ReactNode }) {
  let staff: Awaited<ReturnType<typeof getCurrentStaff>>;
  try {
    staff = await getCurrentStaff();
  } catch {
    staff = { ok: false, error: "request_failed" };
  }

  if (!staff.ok) {
    return (
      <main className="mx-auto max-w-md px-4 py-20">
        <h1 className="font-display text-4xl">Staff access needed</h1>
        <p className="mt-3 text-muted">Sign in with a staff account. A login without a profile cannot open the desk.</p>
        <form action={signOut} className="mt-6">
          <button className="btn btn-ink" type="submit">
            Sign out
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="site-header">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/staff">
            <span className="font-display text-2xl italic leading-none">Numera</span>
            <span className="mt-1 block text-[0.68rem] uppercase tracking-[0.16em] text-[#d9cbb6]">Staff desk</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/staff">Queue</Link>
            <Link href="/staff/history">History</Link>
            <Link href="/staff/counters">Counters</Link>
            <Link href="/board">Board</Link>
            <span className="hidden text-[#d9cbb6] md:inline">{staff.fullName}</span>
            <form action={signOut}>
              <button className="btn btn-ghost" type="submit">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
