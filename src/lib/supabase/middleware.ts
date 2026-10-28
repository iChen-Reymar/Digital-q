import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function applyCookies(response: NextResponse, pending: PendingCookie[]) {
  pending.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === "/staff/login";
  const env = getSupabaseEnv();

  if (!env) {
    if (isLogin) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/staff/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  let pending: PendingCookie[] = [];

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pending = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        applyCookies(supabaseResponse, cookiesToSet);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/staff/login";
    if (pathname !== "/staff") url.searchParams.set("next", pathname);
    return applyCookies(NextResponse.redirect(url), pending);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/staff/login";
      url.search = "";
      url.searchParams.set("error", "profile");
      return applyCookies(NextResponse.redirect(url), pending);
    }

    if (isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/staff";
      url.search = "";
      return applyCookies(NextResponse.redirect(url), pending);
    }
  }

  return supabaseResponse;
}
