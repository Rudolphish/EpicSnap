// src/app/auth/signout/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value;
      },
      async set(name: string, value: string, options: any) {
        try {
          (await cookieStore).set({ name, value, ...options });
        } catch (error) {
          // Handle error if needed
        }
      },
      async remove(name: string, options: any) {
        try {
          (await cookieStore).set({ name, value: "", ...options });
        } catch (error) {
          // Handle error if needed
        }
      },
    },
  });

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", "/"));
}
