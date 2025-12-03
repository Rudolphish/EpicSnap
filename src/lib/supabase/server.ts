// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies(); // await を追加

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      async get(name: string) {
        // async を追加
        try {
          return (await cookieStore.get(name))?.value;
        } catch (error) {
          return undefined;
        }
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
}
