// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        request.cookies.set({ name, value: "", ...options });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 認証が必要なページのパス
  const protectedPaths = ["/dashboard", "/profile"]; // 必要に応じて追加

  // 認証が必要なページにアクセスしようとしていて、ログインしていない場合
  if (protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path)) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ログインページやサインアップページに既にログイン済みでアクセスしようとしている場合
  if (["/login", "/signup"].includes(request.nextUrl.pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
