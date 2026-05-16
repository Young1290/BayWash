import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this explicit so setup errors are obvious in local/dev.
  console.warn("Supabase env vars are missing. Check .env values.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
