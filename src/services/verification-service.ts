import { assertAuthorized, type AuthenticatedIdentity } from "@/lib/authorization";
import type { AdminVerificationCaseListDto } from "@/lib/dto";
import type { VerificationRepository, VerificationDecisionInput } from "@/repositories/contracts";
import { validateTransition } from "@/lib/state-machine";
import { createAuditRecord, type AuditRepository } from "@/lib/audit";

export class VerificationService {
  constructor(
    private readonly repository: VerificationRepository,
    private readonly auditRepository?: AuditRepository,
  ) {}

  async list(identity: AuthenticatedIdentity): Promise<AdminVerificationCaseListDto[]> {
    assertAuthorized(identity, "verification.view");
    return this.repository.list();
  }

  async getById(identity: AuthenticatedIdentity, id: string): Promise<AdminVerificationCaseListDto | null> {
    assertAuthorized(identity, "verification.view");
    return this.repository.getById(id);
  }

  async decide(
    identity: AuthenticatedIdentity,
    input: VerificationDecisionInput,
  ): Promise<AdminVerificationCaseListDto> {
    assertAuthorized(identity, "verification.decide");

    // Load current case state
    const current = await this.repository.getById(input.caseId);
    if (!current) throw new Error("Verification case not found");

    // Validate state transition
    validateTransition("verification", current.status, input.targetDecision);

    // Apply decision
    const updated = await this.repository.applyDecision(input, identity.userId);

    // Create audit record
    if (this.auditRepository) {
      const auditActionMap: Record<string, "VERIFY" | "REJECT" | "APPROVE"> = {
        VERIFIED: "VERIFY",
        REJECTED: "REJECT",
        NEEDS_CORRECTION: "APPROVE", // Using APPROVE for needs correction decision
      };
      await this.auditRepository.append(
        createAuditRecord({
          actor: identity.userId,
          action: auditActionMap[input.targetDecision] || "VERIFY",
          resource: "verification_case",
          resourceId: input.caseId,
          before: { status: current.status },
          after: { status: input.targetDecision },
        }),
      );
    }

    return updated;
  }
}
