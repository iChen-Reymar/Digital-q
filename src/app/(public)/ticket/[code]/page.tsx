import Link from "next/link";
import { TicketLive } from "@/components/ticket-live";
import { SetupNotice } from "@/components/setup-notice";
import { getTicket } from "@/server/queries";

export const metadata = { title: "Your ticket" };

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { code } = await params;
  const { notice } = await searchParams;

  try {
    const result = await getTicket(code);
    if (!result.ok) {
      return (
        <section className="mx-auto max-w-lg py-10 text-center">
          <h1 className="font-display text-5xl">Ticket not found</h1>
          <p className="mt-3 text-muted">
            Check the code on your ticket. It uses letters and numbers, and it leaves out 0, 1, I, and O.
          </p>
          <Link href="/" className="btn btn-ink mt-6">
            Get a ticket
          </Link>
        </section>
      );
    }

    return <TicketLive initial={result} notice={notice === "active"} />;
  } catch {
    return <SetupNotice />;
  }
}
