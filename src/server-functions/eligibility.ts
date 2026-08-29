import { createServerFn } from "@tanstack/react-start";
import { listPlayersEligibilityForRequest, getPlayerEligibilityForRequest, decidePlayerEligibilityForRequest } from "@/services/eligibility-read";
import type { EligibilityDecisionInput } from "@/services/eligibility-service";

export const listPlayersEligibility = createServerFn({ method: "GET" }).handler(() =>
  listPlayersEligibilityForRequest(),
);

export const getPlayerEligibility = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data: id }) => getPlayerEligibilityForRequest(id));

export const decidePlayerEligibility = createServerFn({ method: "POST" })
  .validator((payload: unknown) => {
    if (typeof payload !== "object" || payload === null) throw new Error("Invalid payload");
    const p = payload as Record<string, unknown>;
    const playerId = p.playerId;
    const targetStatus = p.targetStatus;
    const reason = p.reason;
    const notes = p.notes;
    
    if (typeof playerId !== "string") throw new Error("playerId required");
    if (!["ELIGIBLE", "NOT_ELIGIBLE"].includes(String(targetStatus))) {
      throw new Error("Invalid target status");
    }
    if (reason !== undefined && typeof reason !== "string") throw new Error("reason must be string");
    if (notes !== undefined && typeof notes !== "string") throw new Error("notes must be string");
    
    const input: EligibilityDecisionInput = {
      playerId,
      targetStatus: targetStatus as "ELIGIBLE" | "NOT_ELIGIBLE",
    };
    if (reason) input.reason = reason;
    if (notes) input.notes = notes;
    return input;
  })
  .handler(({ data }) => decidePlayerEligibilityForRequest(data));
