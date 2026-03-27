import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing SUPABASE_ANON_KEY environment variable")
}

const globalForSupabase = globalThis as typeof globalThis & {
  supabase?: SupabaseClient
}

export const supabase =
  globalForSupabase.supabase ?? createClient(supabaseUrl, supabaseAnonKey)

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase
}

export default supabase