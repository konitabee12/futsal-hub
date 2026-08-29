import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, getAuthorizationContext } from "@/lib/server";
import { SupabaseAuditRepository } from "@/repositories/supabase-audit-repository";
import { SupabaseContingentRepository } from "@/repositories/supabase-contingent-repository";
import { SupabaseTeamRepository } from "@/repositories/supabase-team-repository";
import { listTeamsForRequest } from "@/services/team-read";
import { TeamService } from "@/services/team-service";
import type { Team } from "@/types/domain";
import type { TeamCreateInput, TeamUpdateInput } from "@/repositories/contracts";

export const listTeams = createServerFn({ method: "GET" })
  .handler(() => listTeamsForRequest());

type UpdatePayload = { id: string; input: TeamUpdateInput };
type TransitionPayload = { id: string; targetStatus: Team["status"] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Invalid team ${field}`);
  return value;
}

function parseCreatePayload(value: unknown): TeamCreateInput {
  if (!isRecord(value)) throw new Error("Invalid team payload");
  return {
    contingentId: requiredString(value["contingentId"], "contingent"),
    category: requiredString(value["category"], "category") as Team["category"],
    name: requiredString(value["name"], "name"),
    shortName: requiredString(value["shortName"], "short name"),
    manager: requiredString(value["manager"], "manager"),
    headCoach: requiredString(value["headCoach"], "head coach"),
  };
}

function parseUpdatePayload(value: unknown): UpdatePayload {
  if (!isRecord(value) || typeof value["id"] !== "string" || !isRecord(value["input"])) {
    throw new Error("Invalid team update payload");
  }
  const mutableKeys = ["name", "shortName", "manager", "headCoach"] as const;
  if (Object.keys(value["input"]).some((key) => !mutableKeys.includes(key as typeof mutableKeys[number]))) {
    throw new Error("Team update contains immutable or unsupported fields");
  }
  const input: TeamUpdateInput = {};
  for (const key of mutableKeys) {
    if (value["input"][key] !== undefined) input[key] = requiredString(value["input"][key], key);
  }
  if (!Object.keys(input).length) throw new Error("No mutable team fields provided");
  return { id: value["id"], input };
}

function parseTransitionPayload(value: unknown): TransitionPayload {
  if (!isRecord(value) || typeof value["id"] !== "string" || typeof value["targetStatus"] !== "string") {
    throw new Error("Invalid team status payload");
  }
  return { id: value["id"], targetStatus: value["targetStatus"] as Team["status"] };
}

async function mutationService(request: Request) {
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return {
    identity,
    service: new TeamService(
      new SupabaseTeamRepository(supabase),
      new SupabaseContingentRepository(supabase),
      new SupabaseAuditRepository(supabase),
    ),
  };
}

export const createTeam = createServerFn({ method: "POST" })
  .validator(parseCreatePayload)
  .handler(async ({ data }) => {
    const { identity, service } = await mutationService(getRequest());
    return service.create(identity, data);
  });

export const updateTeam = createServerFn({ method: "POST" })
  .validator(parseUpdatePayload)
  .handler(async ({ data }) => {
    const { identity, service } = await mutationService(getRequest());
    return service.update(identity, data.id, data.input);
  });

export const transitionTeam = createServerFn({ method: "POST" })
  .validator(parseTransitionPayload)
  .handler(async ({ data }) => {
    const { identity, service } = await mutationService(getRequest());
    return service.transitionStatus(identity, data.id, data.targetStatus);
  });
