import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/">
          <span className="font-display text-2xl italic leading-none">Numera</span>
          <span className="mt-1 hidden text-[0.68rem] uppercase tracking-[0.16em] text-[#d9cbb6] sm:block">
            Digital queue ticket & waiting time
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm sm:gap-5">
          <Link href="/">Get a ticket</Link>
          <Link href="/board">Live board</Link>
          <Link href="/staff" className="btn btn-ghost">
            Staff
          </Link>
        </nav>
      </div>
    </header>
  );
}
