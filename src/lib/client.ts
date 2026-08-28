import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { requireSupabaseConfig } from "@/config/env";

let browserClient: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;
  const config = requireSupabaseConfig();
  browserClient = createBrowserClient<Database>(
    config.supabaseUrl,
    config.supabasePublishableKey,
  );
  return browserClient;
}
