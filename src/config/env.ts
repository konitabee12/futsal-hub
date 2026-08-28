export interface RuntimeConfig {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
}

export const runtimeConfig: RuntimeConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

export function hasSupabaseConfig(config: RuntimeConfig = runtimeConfig): boolean {
  return Boolean(config.supabaseUrl && config.supabasePublishableKey);
}

export function requireSupabaseConfig(config: RuntimeConfig = runtimeConfig): Required<RuntimeConfig> {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error("Supabase runtime configuration is missing");
  }
  return {
    supabaseUrl: config.supabaseUrl,
    supabasePublishableKey: config.supabasePublishableKey,
  };
}