import type { AuthChangeEvent, Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/client";
import type { AuthenticatedSession, AuthGateway, SessionIdentity } from "@/lib/session";
import type { Database } from "@/types/database";

type AuthListener = (session: AuthenticatedSession | null) => void;

function toIdentity(session: Session): SessionIdentity {
  const identity: SessionIdentity = {
    userId: session.user.id,
    roles: [],
    permissions: [],
    eventIds: [],
    sportIds: [],
    contingentIds: [],
    teamIds: [],
    matchIds: [],
  };
  if (session.user.email) identity.email = session.user.email;
  const displayName = session.user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName) identity.displayName = displayName;
  return identity;
}

function toApplicationSession(session: Session): AuthenticatedSession {
  return {
    status: "authenticated",
    identity: toIdentity(session),
    expiresAt: new Date(session.expires_at * 1000).toISOString(),
  };
}

export class SupabaseAuthGateway implements AuthGateway {
  private readonly supabase: SupabaseClient<Database>;

  constructor(supabase = createClient()) {
    this.supabase = supabase;
  }

  async getSession(): Promise<AuthenticatedSession | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw new Error("Unable to restore authentication session");
    return data.session ? toApplicationSession(data.session) : null;
  }

  async signIn(email: string, password: string): Promise<AuthenticatedSession> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error("Email atau kata sandi tidak valid");
    return toApplicationSession(data.session);
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new Error("Unable to sign out");
  }

  onAuthStateChange(listener: AuthListener): () => void {
    const { data } = this.supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session) => listener(session ? toApplicationSession(session) : null),
    );
    return () => data.subscription.unsubscribe();
  }
}