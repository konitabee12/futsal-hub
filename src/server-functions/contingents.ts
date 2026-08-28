import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, getAuthorizationContext } from "@/lib/server";
import { SupabaseAuditRepository } from "@/repositories/supabase-audit-repository";
import { SupabaseContingentRepository } from "@/repositories/supabase-contingent-repository";
import { ContingentService } from "@/services/contingent-service";
import type { Contingent } from "@/types/domain";
import type { ContingentUpdateInput } from "@/repositories/contracts";
import { listContingentsForRequest } from "@/services/contingent-read";

type CreatePayload = Omit<
  Contingent,
  "id" | "eventId" | "sportId" | "status" | "documents" | "verifiedDocuments" | "teamCount"
> & { logoPath?: string };

type UpdatePayload = { id: string; input: ContingentUpdateInput };
type TransitionPayload = { id: string; targetStatus: Contingent["status"] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Invalid contingent ${field}`);
  return value;
}

function parseCreatePayload(value: unknown): CreatePayload {
  if (!isRecord(value)) throw new Error("Invalid contingent payload");
  const payload: CreatePayload = {
    code: requiredString(value.code, "code"),
    name: requiredString(value.name, "name"),
    region: requiredString(value.region, "region"),
    pic: requiredString(value.pic, "pic"),
    email: requiredString(value.email, "email"),
    phone: requiredString(value.phone, "phone"),
  };
  if (value.logoPath !== undefined) payload.logoPath = requiredString(value.logoPath, "logo path");
  return payload;
}

function parseUpdatePayload(value: unknown): UpdatePayload {
  if (!isRecord(value) || typeof value.id !== "string" || !isRecord(value.input)) {
    throw new Error("Invalid contingent update payload");
  }
  return { id: value.id, input: value.input as ContingentUpdateInput };
}

function parseTransitionPayload(value: unknown): TransitionPayload {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.targetStatus !== "string") {
    throw new Error("Invalid contingent status payload");
  }
  return { id: value.id, targetStatus: value.targetStatus as Contingent["status"] };
}

async function mutationService(request: Request) {
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return {
    identity,
    service: new ContingentService(
      new SupabaseContingentRepository(supabase),
      new SupabaseAuditRepository(supabase),
    ),
  };
}

export const listContingents = createServerFn({ method: "GET" })
  .handler(() => listContingentsForRequest());

export const createContingent = createServerFn({ method: "POST" })
  .validator(parseCreatePayload)
  .handler(async ({ data }) => {
    const request = getRequest();
    const { identity, service } = await mutationService(request);
    let eventId = identity.eventIds?.[0];
    let sportId = identity.sportIds?.[0];
    if (!eventId && sportId) {
      const { supabase } = createClient(request);
      const { data: sport, error } = await supabase
        .from("sports")
        .select("event_id")
        .eq("id", sportId)
        .maybeSingle();
      if (error) throw new Error("Unable to resolve creation scope");
      eventId = sport?.event_id;
    }
    if (!sportId && eventId) {
      const { supabase } = createClient(request);
      const { data: sport, error } = await supabase
        .from("sports")
        .select("id")
        .eq("event_id", eventId)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error("Unable to resolve creation scope");
      sportId = sport?.id;
    }
    if (!eventId || !sportId) throw new Error("No creation scope assigned");
    return service.create(identity, { ...data, eventId, sportId });
  });

export const updateContingent = createServerFn({ method: "POST" })
  .validator(parseUpdatePayload)
  .handler(async ({ data }) => {
    const request = getRequest();
    const { identity, service } = await mutationService(request);
    return service.update(identity, data.id, data.input);
  });

export const transitionContingent = createServerFn({ method: "POST" })
  .validator(parseTransitionPayload)
  .handler(async ({ data }) => {
    const request = getRequest();
    const { identity, service } = await mutationService(request);
    return service.transitionStatus(identity, data.id, data.targetStatus);
  });