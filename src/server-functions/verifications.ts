import { createServerFn } from "@tanstack/react-start";
import { listVerificationCasesForRequest, getVerificationCaseForRequest, decideVerificationCaseForRequest } from "@/services/verification-read";
import type { VerificationDecisionInput } from "@/repositories/contracts";

export const listVerificationCases = createServerFn({ method: "GET" }).handler(() =>
  listVerificationCasesForRequest(),
);

export const getVerificationCase = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(({ data: id }) => getVerificationCaseForRequest(id));

export const decideVerificationCase = createServerFn({ method: "POST" })
  .validator((payload: unknown) => {
    if (typeof payload !== "object" || payload === null) throw new Error("Invalid payload");
    const p = payload as Record<string, unknown>;
    const caseId = p.caseId;
    const targetDecision = p.targetDecision;
    const reason = p.reason;
    const notes = p.notes;
    if (typeof caseId !== "string") throw new Error("caseId required");
    if (!["VERIFIED", "NEEDS_CORRECTION", "REJECTED"].includes(String(targetDecision))) {
      throw new Error("Invalid target decision");
    }
    if (reason !== undefined && typeof reason !== "string") throw new Error("reason must be string");
    if (notes !== undefined && typeof notes !== "string") throw new Error("notes must be string");
    const input: VerificationDecisionInput = {
      caseId,
      targetDecision: targetDecision as "VERIFIED" | "NEEDS_CORRECTION" | "REJECTED",
    };
    if (reason) input.reason = reason;
    if (notes) input.notes = notes;
    return input;
  })
  .handler(({ data }) => decideVerificationCaseForRequest(data));
