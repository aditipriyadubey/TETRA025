// src/lib/supabaseClient.ts
//
// EduBridge AI — Browser Supabase Client
//
// Creates a single reusable Supabase client for the browser.
// Uses the anon key (safe for client-side) — never service-role.
//
// SECURITY:
//   Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are read here.
//   GROQ_API_KEY, GEMINI_API_KEY, and SUPABASE_SERVICE_ROLE_KEY
//   must NEVER appear in client-side code.

import { createClient } from "@supabase/supabase-js";

// Strip trailing slash to prevent double-slash in SDK-constructed URLs
// e.g. supabase.functions.invoke() builds: `${url}/functions/v1/${name}`
const rawUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseUrl = rawUrl?.replace(/\/+$/, "");
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local. " +
      "See .env.example for reference.",
  );
}

/**
 * Shared browser Supabase client.
 *
 * - Uses the anon key (client-safe, RLS-enforced).
 * - No auth configuration — EduBridge AI is anonymous/session-based.
 * - Reuse this singleton across all API wrappers and database helpers.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
