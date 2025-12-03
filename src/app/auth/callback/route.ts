// src/app/auth/callback/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies(); // await を追加
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        async get(name: string) {
          // async を追加
          return (await cookieStore.get(name))?.value;
        },
        async set(name: string, value: string, options: any) {
          // async を追加
          try {
            await cookieStore.set({
              name,
              value,
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
          } catch (error) {
            console.error("Error setting cookie:", error);
          }
        },
        async remove(name: string, options: any) {
          // async を追加
          try {
            await cookieStore.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
              expires: new Date(0),
            });
          } catch (error) {
            console.error("Error removing cookie:", error);
          }
        },
      },
    });

    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate user`);
    }
  }

  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
