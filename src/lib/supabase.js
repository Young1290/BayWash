import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this explicit so setup errors are obvious in browser local/dev.
  if (typeof window !== "undefined") {
    console.warn("Supabase env vars are missing. Check .env values.");
  }
}

export const supabase =
  isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        async rpc() {
          throw new Error("Supabase client is not configured");
        },
      };
