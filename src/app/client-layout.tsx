// src/app/client-layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      router.refresh();
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
        {session && <Navigation />}
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700/50 overflow-hidden">{children}</div>
        </main>
        <footer className="py-6 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} EpicSnap. All rights reserved.</p>
        </footer>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
