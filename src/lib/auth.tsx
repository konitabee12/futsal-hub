import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SupabaseAuthGateway } from "@/services/auth-gateway";
import { createClient } from "@/lib/client";
import { resolveAuthorizationContext } from "@/services/authorization-context";
import { AuthContext, type AuthContextValue } from "@/lib/auth-context";
import type { AuthenticatedSession, AuthGateway } from "@/lib/session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let gateway: AuthGateway | undefined;
    try {
      gateway = new SupabaseAuthGateway();
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Authentication is unavailable" });
      return;
    }

    let active = true;
    const resolveSession = async (session: AuthenticatedSession): Promise<AuthenticatedSession> => {
      const authorization = await resolveAuthorizationContext(createClient(), session.identity.userId);
      return { ...session, identity: authorization };
    };

    void gateway.getSession()
      .then((session) => session ? resolveSession(session) : null)
      .then((resolvedSession) => {
        if (active) setState(resolvedSession ? resolvedSession : { status: "anonymous" });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: "error", message: error instanceof Error ? error.message : "Unable to restore authentication session" });
      });

    const unsubscribe = gateway.onAuthStateChange?.((session) => {
      if (!session) {
        setState({ status: "anonymous" });
        void queryClient.clear();
        return;
      }
      void resolveSession(session)
        .then((resolvedSession) => { if (active) setState(resolvedSession); })
        .catch((error: unknown) => {
          if (active) setState({ status: "error", message: error instanceof Error ? error.message : "Unable to resolve authorization" });
        });
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({
    state,
    signIn: async (email, password) => {
      try {
        const session = await new SupabaseAuthGateway().signIn(email, password);
        const authorization = await resolveAuthorizationContext(createClient(), session.identity.userId);
        const resolvedSession = { ...session, identity: authorization };
        setState(resolvedSession);
        return resolvedSession;
      } catch (error) {
        setState({ status: "error", message: error instanceof Error ? error.message : "Unable to sign in" });
        throw error;
      }
    },
    signOut: async () => {
      await new SupabaseAuthGateway().signOut();
      await queryClient.clear();
      setState({ status: "anonymous" });
    },
  }), [queryClient, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

