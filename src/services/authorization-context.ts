import type { SupabaseClient } from "@supabase/supabase-js";
import { PERMISSIONS, ROLE_LABEL } from "@/lib/rbac";
import type {
  AuthorizationContext,
  AuthorizationScope,
  ScopeAssignment,
} from "@/lib/authorization";
import type { Database } from "@/types/database";
import type { Permission } from "@/lib/rbac";
import type { Role } from "@/types/domain";

const ROLE_CODES = Object.keys(ROLE_LABEL) as Role[];

function isRole(value: string): value is Role {
  return ROLE_CODES.includes(value as Role);
}

function isPermission(value: string): value is Permission {
  return PERMISSIONS.includes(value as Permission);
}

function addScope(scopes: ScopeAssignment[], scope: AuthorizationScope, scopeId?: string): void {
  const exists = scopes.some((item) => item.scope === scope && item.scopeId === scopeId);
  if (!exists) {
    const assignment: ScopeAssignment = { scope };
    if (scopeId) assignment.scopeId = scopeId;
    scopes.push(assignment);
  }
}

export async function resolveAuthorizationContext(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AuthorizationContext> {
  const { data: applicationUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (userError) throw new Error("Unable to resolve application user");
  if (!applicationUser) throw new Error("Application user is not provisioned");

  const { data: assignments, error: assignmentError } = await supabase
    .from("user_roles")
    .select("id, role_id, event_id, sport_id, contingent_id, team_id")
    .eq("user_id", userId);
  if (assignmentError) throw new Error("Unable to resolve role assignments");

  const roleIds = assignments.map((assignment) => assignment.role_id);
  if (!roleIds.length) {
    return {
      applicationUserId: applicationUser.id,
      userId,
      roles: [],
      permissions: [],
      scopes: [],
      eventIds: [],
      sportIds: [],
      contingentIds: [],
      teamIds: [],
      matchIds: [],
    };
  }

  const [{ data: roles, error: roleError }, { data: rolePermissions, error: rolePermissionError }] = await Promise.all([
    supabase.from("roles").select("id, code").in("id", roleIds),
    supabase.from("role_permissions").select("role_id, permission_id").in("role_id", roleIds),
  ]);
  if (roleError) throw new Error("Unable to resolve roles");
  if (rolePermissionError) throw new Error("Unable to resolve role permissions");

  const permissionIds = rolePermissions.map((assignment) => assignment.permission_id);
  const { data: permissions, error: permissionError } = permissionIds.length
    ? await supabase.from("permissions").select("id, code").in("id", permissionIds)
    : { data: [], error: null };
  if (permissionError) throw new Error("Unable to resolve permissions");

  const roleById = new Map(roles.map((role) => [role.id, role.code]));
  const rolesResolved = roles.flatMap((role) => (isRole(role.code) ? [role.code] : []));
  const permissionsResolved = permissions.flatMap((permission) => (
    isPermission(permission.code) ? [permission.code] : []
  ));
  const scopes: ScopeAssignment[] = [];
  const eventIds: string[] = [];
  const sportIds: string[] = [];
  const contingentIds: string[] = [];
  const teamIds: string[] = [];

  for (const assignment of assignments) {
    const roleCode = roleById.get(assignment.role_id);
    if (!roleCode || !isRole(roleCode)) continue;
    if (assignment.event_id) { eventIds.push(assignment.event_id); addScope(scopes, "EVENT", assignment.event_id); }
    if (assignment.sport_id) { sportIds.push(assignment.sport_id); addScope(scopes, "SPORT", assignment.sport_id); }
    if (assignment.contingent_id) { contingentIds.push(assignment.contingent_id); addScope(scopes, "CONTINGENT", assignment.contingent_id); }
    if (assignment.team_id) { teamIds.push(assignment.team_id); addScope(scopes, "TEAM", assignment.team_id); }
    if (!assignment.event_id && !assignment.sport_id && !assignment.contingent_id && !assignment.team_id) {
      addScope(scopes, roleCode === "SUPER_ADMIN" ? "SYSTEM" : "EVENT");
    }
  }

  return {
    applicationUserId: applicationUser.id,
    userId,
    roles: [...new Set(rolesResolved)],
    permissions: [...new Set(permissionsResolved)],
    scopes,
    eventIds: [...new Set(eventIds)],
    sportIds: [...new Set(sportIds)],
    contingentIds: [...new Set(contingentIds)],
    teamIds: [...new Set(teamIds)],
    matchIds: [],
  };
}