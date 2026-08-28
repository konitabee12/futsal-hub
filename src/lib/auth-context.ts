import { createContext, useContext } from "react";
import type { AuthenticatedSession, SessionState } from "@/lib/session";

export interface AuthContextValue {
  state: SessionState;
  signIn: (email: string, password: string) => Promise<AuthenticatedSession>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  state: { status: "loading" },
  signIn: async () => { throw new Error("Authentication is unavailable"); },
  signOut: async () => { throw new Error("Authentication is unavailable"); },
});

export function useAuth() {
  return useContext(AuthContext);
}