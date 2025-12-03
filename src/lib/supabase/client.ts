// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

// Create a single supabase client for interacting with your database
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export { supabase };
