import { describe, it, expect } from "bun:test";
import { VerificationService } from "@/services/verification-service";
import type { AdminVerificationCaseListDto } from "@/lib/dto";
import type { VerificationRepository, VerificationDecisionInput } from "@/repositories/contracts";
import type { AuditRepository } from "@/lib/audit";

const mockRepository: VerificationRepository = {
  list: async () => [
    {
      id: "vc-1",
      subjectType: "PLAYER",
      subjectName: "Player A",
      category: "PUTRA",
      contingentName: "Contingent A",
      status: "SUBMITTED",
      submittedAt: "2026-08-29T10:00:00Z",
      items: [{ label: "NIK", status: "PENDING" }],
      decisions: [{ decision: "SUBMITTED", by: "Admin", at: "2026-08-29 10:00", reason: undefined, notes: undefined }],
    },
  ],
  getById: async (id: string) => ({
    id,
    subjectType: "PLAYER",
    subjectName: "Player A",
    category: "PUTRA",
    contingentName: "Contingent A",
    status: "SUBMITTED",
    submittedAt: "2026-08-29T10:00:00Z",
    items: [{ label: "NIK", status: "PENDING" }],
    decisions: [{ decision: "SUBMITTED", by: "Admin", at: "2026-08-29 10:00", reason: undefined, notes: undefined }],
  }),
  applyDecision: async (input: VerificationDecisionInput, decidedBy: string) => ({
    id: input.caseId,
    subjectType: "PLAYER",
    subjectName: "Player A",
    category: "PUTRA",
    contingentName: "Contingent A",
    status: input.targetDecision,
    submittedAt: "2026-08-29T10:00:00Z",
    items: [{ label: "NIK", status: "PENDING" }],
    decisions: [{ decision: input.targetDecision, by: decidedBy, at: "2026-08-29 11:00", reason: input.reason, notes: input.notes }],
  }),
};

const mockAuditRepository: AuditRepository = {
  append: async () => undefined,
};

describe("VerificationService", () => {
  it("should deny list without verification.view permission", async () => {
    const service = new VerificationService(mockRepository);
    const identity = {
      userId: "user-1",
      roles: ["TEAM_MANAGER"],
      permissions: [],
      scopes: [],
    };

    try {
      await service.list(identity);
      expect(false).toBe(true); // Should not reach here
    } catch (err: unknown) {
      expect((err as { message?: string }).message).toContain("Authorization denied");
    }
  });

  it("should allow list with verification.view permission", async () => {
    const service = new VerificationService(mockRepository);
    const identity = {
      userId: "user-1",
      roles: ["VERIFIER"],
      permissions: ["verification.view"],
      scopes: [],
    };

    const result = await service.list(identity);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("vc-1");
  });

  it("should allow getById with verification.view permission", async () => {
    const service = new VerificationService(mockRepository);
    const identity = {
      userId: "user-1",
      roles: ["VERIFIER"],
      permissions: ["verification.view"],
      scopes: [],
    };

    const result = await service.getById(identity, "vc-1");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("vc-1");
  });

  it("should deny getById without verification.view permission", async () => {
    const service = new VerificationService(mockRepository);
    const identity = {
      userId: "user-1",
      roles: ["TEAM_MANAGER"],
      permissions: [],
      scopes: [],
    };

    try {
      await service.getById(identity, "vc-1");
      expect(false).toBe(true); // Should not reach here
    } catch (err: unknown) {
      expect((err as { message?: string }).message).toContain("Authorization denied");
    }
  });

  it("should deny decide without verification.decide permission", async () => {
    const service = new VerificationService(mockRepository, mockAuditRepository);
    const identity = {
      userId: "user-1",
      roles: ["VERIFIER"],
      permissions: ["verification.view"], // Has view but not decide
      scopes: [],
    };

    try {
      await service.decide(identity, { caseId: "vc-1", targetDecision: "VERIFIED" });
      expect(false).toBe(true); // Should not reach here
    } catch (err: unknown) {
      expect((err as { message?: string }).message).toContain("Authorization denied");
    }
  });

  it("should allow decide with verification.decide permission", async () => {
    const service = new VerificationService(mockRepository, mockAuditRepository);
    const identity = {
      userId: "user-1",
      roles: ["VERIFIER"],
      permissions: ["verification.view", "verification.decide"],
      scopes: [],
    };

    // Mock the getById to return a case in UNDER_REVIEW state (valid for transition to VERIFIED)
    const underReviewCase: AdminVerificationCaseListDto = {
      id: "vc-1",
      subjectType: "PLAYER",
      subjectName: "Player A",
      category: "PUTRA",
      contingentName: "Contingent A",
      status: "UNDER_REVIEW",
      submittedAt: "2026-08-29T10:00:00Z",
      items: [{ label: "NIK", status: "PENDING" }],
      decisions: [],
    };
    
    const repositoryWithMock: VerificationRepository = {
      ...mockRepository,
      getById: async () => underReviewCase,
    };

    const result = await new VerificationService(repositoryWithMock, mockAuditRepository).decide(identity, {
      caseId: "vc-1",
      targetDecision: "VERIFIED",
    });
    expect(result.status).toBe("VERIFIED");
  });

  it("should reject invalid state transitions", async () => {
    const service = new VerificationService(mockRepository, mockAuditRepository);
    const identity = {
      userId: "user-1",
      roles: ["VERIFIER"],
      permissions: ["verification.view", "verification.decide"],
      scopes: [],
    };

    // Mock to return a case already VERIFIED (cannot transition to NEEDS_CORRECTION)
    const verifiedCase: AdminVerificationCaseListDto = {
      id: "vc-1",
      subjectType: "PLAYER",
      subjectName: "Player A",
      category: "PUTRA",
      contingentName: "Contingent A",
      status: "VERIFIED",
      submittedAt: "2026-08-29T10:00:00Z",
      items: [{ label: "NIK", status: "VERIFIED" }],
      decisions: [],
    };
    
    const repositoryWithMock: VerificationRepository = {
      ...mockRepository,
      getById: async () => verifiedCase,
    };

    try {
      await new VerificationService(repositoryWithMock, mockAuditRepository).decide(identity, {
        caseId: "vc-1",
        targetDecision: "NEEDS_CORRECTION",
      });
      expect(false).toBe(true); // Should not reach here
    } catch (err: unknown) {
      expect((err as { message?: string }).message).toContain("Invalid verification transition");
    }
  });
});
