import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-display text-6xl">404</p>
      <p className="mt-3 text-muted">That page is not on the board.</p>
      <Link href="/" className="btn btn-ink mt-6">
        Back to tickets
      </Link>
    </main>
  );
}
