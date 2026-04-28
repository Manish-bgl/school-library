import { createClient } from "@supabase/supabase-js";

// We use import.meta.env for Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing Supabase configuration in .env file");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
