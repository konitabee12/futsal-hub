import type { Role } from "@/types/domain";
import type { Permission } from "@/lib/rbac";

export interface SessionIdentity {
  userId: string;
  email?: string;
  displayName?: string;
  roles: Role[];
  permissions: Permission[];
  eventIds: string[];
  sportIds: string[];
  contingentIds: string[];
  teamIds: string[];
  matchIds: string[];
}

export interface AuthSession {
  identity: SessionIdentity;
  expiresAt: string;
}

export interface AnonymousSession {
  status: "anonymous";
}

export interface AuthenticatedSession extends AuthSession {
  status: "authenticated";
}

export type SessionState =
  | { status: "loading" }
  | AnonymousSession
  | AuthenticatedSession
  | { status: "error"; message: string };

export interface AuthGateway {
  getSession(): Promise<AuthSession | null>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  onAuthStateChange?(listener: (session: AuthSession | null) => void): () => void;
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

export function requireSession(session: AuthSession | null): AuthSession {
  if (!session) throw new AuthenticationRequiredError();
  return session;
}