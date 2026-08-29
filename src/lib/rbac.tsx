import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Role } from "@/types/domain";
import { useAuth } from "@/lib/auth-context";

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  EVENT_ADMIN: "Admin Event",
  FUTSAL_ADMIN: "Admin Futsal",
  VERIFIER: "Verifikator",
  COMPETITION_OPERATOR: "Operator Kompetisi",
  MATCH_OPERATOR: "Operator Pertandingan",
  MATCH_OFFICIAL: "Perangkat Pertandingan",
  CONTINGENT_ADMIN: "Admin Kontingen",
  TEAM_MANAGER: "Manajer Tim",
};

export const ROLE_SCOPE: Record<Role, string> = {
  SUPER_ADMIN: "SYSTEM",
  EVENT_ADMIN: "EVENT",
  FUTSAL_ADMIN: "SPORT",
  VERIFIER: "SPORT",
  COMPETITION_OPERATOR: "SPORT",
  MATCH_OPERATOR: "MATCH",
  MATCH_OFFICIAL: "MATCH",
  CONTINGENT_ADMIN: "CONTINGENT",
  TEAM_MANAGER: "TEAM",
};

export type Permission =
  | "dashboard.view"
  | "contingent.view"
  | "contingent.create"
  | "contingent.update"
  | "team.view"
  | "team.create"
  | "team.update"
  | "player.view"
  | "player.create"
  | "player.update"
  | "official.view"
  | "document.view"
  | "verification.view"
  | "verification.decide"
  | "eligibility.view"
  | "eligibility.decide"
  | "competition.view"
  | "competition.update"
  | "venue.view"
  | "schedule.view"
  | "schedule.update"
  | "match.view"
  | "match.operate"
  | "result.view"
  | "result.verify"
  | "standings.view"
  | "standings.recalculate"
  | "audit.view"
  | "notification.view";

export const PERMISSIONS: Permission[] = [
  "dashboard.view", "contingent.view", "contingent.create", "contingent.update", "team.view", "team.create", "team.update",
  "player.view", "player.create", "player.update", "official.view", "document.view", "verification.view",
  "verification.decide", "eligibility.view", "eligibility.decide", "competition.view", "competition.update",
  "venue.view", "schedule.view", "schedule.update", "match.view", "match.operate",
  "result.view", "result.verify", "standings.view", "standings.recalculate",
  "audit.view", "notification.view",
];

const BASE: Permission[] = ["dashboard.view", "notification.view"];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  EVENT_ADMIN: PERMISSIONS.filter((p) => p !== "match.operate"),
  FUTSAL_ADMIN: PERMISSIONS.filter((p) => p !== "audit.view"),
  VERIFIER: [
    ...BASE, "contingent.view", "team.view", "player.view", "official.view",
    "document.view", "verification.view", "verification.decide", "eligibility.view", "eligibility.decide",
  ],
  COMPETITION_OPERATOR: [
    ...BASE, "team.view", "competition.view", "competition.update", "venue.view",
    "schedule.view", "schedule.update", "match.view", "standings.view",
  ],
  MATCH_OPERATOR: [
    ...BASE, "team.view", "player.view", "match.view", "match.operate",
    "schedule.view", "result.view",
  ],
  MATCH_OFFICIAL: [...BASE, "match.view", "schedule.view", "result.view"],
  CONTINGENT_ADMIN: [
    ...BASE, "contingent.view", "contingent.update", "team.view", "team.create", "team.update",
    "player.view", "player.create", "player.update", "official.view", "document.view", "eligibility.view",
    "schedule.view", "match.view", "standings.view",
  ],
  TEAM_MANAGER: [
    ...BASE, "team.view", "team.update", "player.view", "player.create", "player.update", "official.view",
    "document.view", "eligibility.view", "schedule.view", "match.view", "standings.view",
  ],
};

interface RbacValue {
  role: Role;
  setRole: (r: Role) => void;
  can: (p: Permission) => boolean;
}

const RbacContext = createContext<RbacValue>({
  role: "SUPER_ADMIN",
  setRole: () => {},
  can: () => true,
});

export function RbacProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("SUPER_ADMIN");
  const { state: authState } = useAuth();
  const resolvedRoles = authState.status === "authenticated" ? authState.identity.roles : [];
  const resolvedPermissions = authState.status === "authenticated" ? authState.identity.permissions : [];
  const activeRole = resolvedRoles[0] ?? role;
  const value = useMemo<RbacValue>(
    () => ({
      role: activeRole,
      setRole,
      can: (p: Permission) => authState.status === "authenticated"
        && resolvedPermissions.includes(p),
    }),
    [activeRole, authState.status, resolvedPermissions],
  );
  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbac() {
  return useContext(RbacContext);
}
