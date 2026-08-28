import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
  type SupabaseClient,
} from "@supabase/ssr";
import { requireSupabaseConfig } from "@/config/env";
import { AuthenticationRequiredError } from "@/lib/session";
import { resolveAuthorizationContext } from "@/services/authorization-context";
import type { Database } from "@/types/database";

export function createClient(request: Request): {
  supabase: SupabaseClient<Database>;
  headers: Headers;
} {
  const headers = new Headers();
  const config = requireSupabaseConfig({
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabasePublishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });

  const supabase = createServerClient<Database>(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "") as {
            name: string;
            value: string;
          }[];
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
          });
          Object.entries(cacheHeaders).forEach(([name, value]) => {
            headers.set(name, value);
          });
        },
      },
    },
  );

  return { supabase, headers };
}

export async function requireAuthenticatedUser(request: Request) {
  const { supabase } = createClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthenticationRequiredError();
  return data.user;
}

export async function getAuthorizationContext(request: Request) {
  const user = await requireAuthenticatedUser(request);
  return resolveAuthorizationContext(createClient(request).supabase, user.id);
}
