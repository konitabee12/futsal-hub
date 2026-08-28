import { ROLE_PERMISSIONS, ROLE_SCOPE, type Permission } from "@/lib/rbac";
import type { Role } from "@/types/domain";

export type AuthorizationScope =
  | "SYSTEM"
  | "EVENT"
  | "SPORT"
  | "COMPETITION"
  | "CONTINGENT"
  | "TEAM"
  | "MATCH";

export interface AuthenticatedIdentity {
  userId: string;
  roles: Role[];
  permissions?: Permission[];
  scopes?: ScopeAssignment[];
  eventIds?: string[];
  sportIds?: string[];
  competitionIds?: string[];
  contingentIds?: string[];
  teamIds?: string[];
  matchIds?: string[];
}

export interface ResourceContext {
  scope: AuthorizationScope;
  eventId?: string;
  sportId?: string;
  competitionId?: string;
  contingentId?: string;
  teamId?: string;
  matchId?: string;
}

export interface ScopeAssignment {
  scope: AuthorizationScope;
  scopeId?: string;
}

export interface AuthorizationContext extends AuthenticatedIdentity {
  applicationUserId: string;
  scopes: ScopeAssignment[];
}

export function hasPermission(identity: AuthenticatedIdentity, permission: Permission): boolean {
  return identity.permissions !== undefined
    ? identity.permissions.includes(permission)
    : identity.roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason?: "MISSING_PERMISSION" | "MISSING_SCOPE" | "RESOURCE_OUTSIDE_SCOPE";
}

function includesId(ids: string[] | undefined, id: string | undefined): boolean {
  return id !== undefined && ids?.includes(id) === true;
}

function resourceId(resource: ResourceContext): string | undefined {
  switch (resource.scope) {
    case "EVENT": return resource.eventId;
    case "SPORT": return resource.sportId;
    case "COMPETITION": return resource.competitionId;
    case "CONTINGENT": return resource.contingentId;
    case "TEAM": return resource.teamId;
    case "MATCH": return resource.matchId;
    case "SYSTEM": return undefined;
  }
}

function hasResourceScope(identity: AuthenticatedIdentity, resource: ResourceContext): boolean {
  if (identity.scopes) {
    if (identity.scopes.some((scope) => scope.scope === "SYSTEM")) return true;
    if (identity.scopes.some((scope) => scope.scope === resource.scope && scope.scopeId === resourceId(resource))) {
      return true;
    }
    if (resource.scope === "TEAM" && resource.contingentId) {
      return identity.scopes.some(
        (scope) => scope.scope === "CONTINGENT" && scope.scopeId === resource.contingentId,
      );
    }
  }

  switch (resource.scope) {
    case "SYSTEM":
      return true;
    case "EVENT":
      return includesId(identity.eventIds, resource.eventId);
    case "SPORT":
      return includesId(identity.sportIds, resource.sportId);
    case "COMPETITION":
      return includesId(identity.competitionIds, resource.competitionId);
    case "CONTINGENT":
      return includesId(identity.contingentIds, resource.contingentId)
        || includesId(identity.eventIds, resource.eventId)
        || includesId(identity.sportIds, resource.sportId);
    case "TEAM":
      return includesId(identity.teamIds, resource.teamId);
    case "MATCH":
      return includesId(identity.matchIds, resource.matchId);
  }
}

function roleCanAccessResource(role: Role, resource: ResourceContext): boolean {
  const roleScope = ROLE_SCOPE[role] as AuthorizationScope;
  if (role === "SUPER_ADMIN" || roleScope === "SYSTEM") return true;
  if (roleScope === resource.scope) return true;
  return (
    (roleScope === "EVENT" && ["SPORT", "COMPETITION", "CONTINGENT", "TEAM", "MATCH"].includes(resource.scope)) ||
    (roleScope === "SPORT" && ["COMPETITION", "CONTINGENT", "TEAM", "MATCH"].includes(resource.scope)) ||
    (roleScope === "COMPETITION" && ["CONTINGENT", "TEAM", "MATCH"].includes(resource.scope)) ||
    (roleScope === "CONTINGENT" && ["TEAM", "MATCH"].includes(resource.scope))
  );
}

export function authorize(
  identity: AuthenticatedIdentity,
  permission: Permission,
  resource?: ResourceContext,
): AuthorizationDecision {
  const permittedRoles = identity.permissions !== undefined
    ? identity.roles
    : identity.roles.filter((role) => ROLE_PERMISSIONS[role].includes(permission));
  if (!hasPermission(identity, permission)) return { allowed: false, reason: "MISSING_PERMISSION" };
  if (!resource || identity.roles.includes("SUPER_ADMIN")) return { allowed: true };

  const scopedRole = permittedRoles.find((role) => roleCanAccessResource(role, resource));
  if (!scopedRole) return { allowed: false, reason: "MISSING_SCOPE" };
  if (ROLE_SCOPE[scopedRole] === "SYSTEM") return { allowed: true };
  return hasResourceScope(identity, resource)
    ? { allowed: true }
    : { allowed: false, reason: "RESOURCE_OUTSIDE_SCOPE" };
}

export function assertAuthorized(
  identity: AuthenticatedIdentity,
  permission: Permission,
  resource?: ResourceContext,
): void {
  const decision = authorize(identity, permission, resource);
  if (!decision.allowed) {
    throw new Error(`Authorization denied: ${decision.reason ?? "UNKNOWN"}`);
  }
}