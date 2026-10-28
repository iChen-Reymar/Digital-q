import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { SetupNotice } from "@/components/setup-notice";
import { getSupabaseEnv } from "@/lib/env";

export const metadata = { title: "Staff sign in" };

function safeNext(value: string | undefined) {
  if (!value || !/^\/staff(\/|$)/.test(value) || value.startsWith("/staff/login")) return "/staff";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (!getSupabaseEnv()) return <SetupNotice />;

  const notice =
    params.error === "profile" ? "That account is not on the staff list." : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-16">
      <Link href="/" className="font-display text-3xl italic">
        Numera
      </Link>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold">Staff desk</p>
      <h1 className="mt-6 font-display text-5xl">Sign in</h1>
      <p className="mt-2 text-muted">Customers do not need an account. This door is only for the counter.</p>
      <div className="panel mt-6 px-5 py-6">
        <LoginForm nextPath={safeNext(params.next)} notice={notice} />
      </div>
    </main>
  );
}
