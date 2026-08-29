import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, getAuthorizationContext } from "@/lib/server";
import { SupabaseAuditRepository } from "@/repositories/supabase-audit-repository";
import { SupabasePlayerRepository } from "@/repositories/supabase-player-repository";
import { SupabaseTeamRepository } from "@/repositories/supabase-team-repository";
import type { PlayerCreateInput, PlayerUpdateInput } from "@/repositories/contracts";
import { listPlayersForRequest } from "@/services/player-read";
import { PlayerService } from "@/services/player-service";
import type { Player } from "@/types/domain";

export const listPlayers = createServerFn({ method: "GET" })
  .handler(() => listPlayersForRequest());

type UpdatePayload = { id: string; input: PlayerUpdateInput };
type TransitionPayload = { id: string; targetStatus: Player["status"] };
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function requiredString(value: unknown, field: string): string { if (typeof value !== "string") throw new Error(`Invalid player ${field}`); return value; }
function requiredNumber(value: unknown, field: string): number { if (typeof value !== "number") throw new Error(`Invalid player ${field}`); return value; }

function parseCreatePayload(value: unknown): PlayerCreateInput {
  if (!isRecord(value)) throw new Error("Invalid player payload");
  const keys = ["teamId", "name", "number", "position", "birthDate", "identityType", "identityNumber"];
  if (Object.keys(value).some((key) => !keys.includes(key))) throw new Error("Player create contains unsupported fields");
  return {
    teamId: requiredString(value["teamId"], "team"), name: requiredString(value["name"], "name"),
    number: requiredNumber(value["number"], "number"), position: requiredString(value["position"], "position") as Player["position"],
    birthDate: requiredString(value["birthDate"], "birth date"), identityType: requiredString(value["identityType"], "identity type") as PlayerCreateInput["identityType"],
    identityNumber: requiredString(value["identityNumber"], "identity number"),
  };
}
function parseUpdatePayload(value: unknown): UpdatePayload {
  if (!isRecord(value) || typeof value["id"] !== "string" || !isRecord(value["input"])) throw new Error("Invalid player update payload");
  const mutableKeys = ["name", "number", "position"] as const;
  if (Object.keys(value["input"]).some((key) => !mutableKeys.includes(key as typeof mutableKeys[number]))) throw new Error("Player update contains immutable or unsupported fields");
  const input: PlayerUpdateInput = {};
  if (value["input"]["name"] !== undefined) input.name = requiredString(value["input"]["name"], "name");
  if (value["input"]["number"] !== undefined) input.number = requiredNumber(value["input"]["number"], "number");
  if (value["input"]["position"] !== undefined) input.position = requiredString(value["input"]["position"], "position") as Player["position"];
  if (!Object.keys(input).length) throw new Error("No mutable player fields provided");
  return { id: value["id"], input };
}
function parseTransitionPayload(value: unknown): TransitionPayload {
  if (!isRecord(value) || typeof value["id"] !== "string" || typeof value["targetStatus"] !== "string") throw new Error("Invalid player status payload");
  return { id: value["id"], targetStatus: value["targetStatus"] as Player["status"] };
}
async function mutationService(request: Request) {
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return { identity, service: new PlayerService(new SupabasePlayerRepository(supabase), new SupabaseTeamRepository(supabase), new SupabaseAuditRepository(supabase)) };
}
export const createPlayer = createServerFn({ method: "POST" }).validator(parseCreatePayload).handler(async ({ data }) => {
  const { identity, service } = await mutationService(getRequest()); return service.create(identity, data);
});
export const updatePlayer = createServerFn({ method: "POST" }).validator(parseUpdatePayload).handler(async ({ data }) => {
  const { identity, service } = await mutationService(getRequest()); return service.update(identity, data.id, data.input);
});
export const transitionPlayer = createServerFn({ method: "POST" }).validator(parseTransitionPayload).handler(async ({ data }) => {
  const { identity, service } = await mutationService(getRequest()); return service.transitionStatus(identity, data.id, data.targetStatus);
});
