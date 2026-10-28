import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted">
        Numera holds your place in the registrar queue. The waiting time is an estimate, not a promise.
      </footer>
    </>
  );
}
