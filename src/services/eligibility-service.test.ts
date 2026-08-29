import { describe, it, expect, beforeEach, vi } from "vitest";
import { EligibilityService } from "./eligibility-service";
import type { EligibilityRepository } from "@/repositories/contracts";
import type { AuditRepository } from "@/repositories/contracts";
import type { AuthorizationContext } from "@/lib/rbac";
import type { AdminPlayerListDto } from "@/lib/dto";

// Mock repositories
const mockEligibilityRepository: EligibilityRepository = {
  listPlayersWithEligibility: vi.fn(),
  getPlayerById: vi.fn(),
  updatePlayerEligibility: vi.fn(),
};

const mockAuditRepository: AuditRepository = {
  append: vi.fn(),
};

describe("EligibilityService", () => {
  let service: EligibilityService;
  let mockIdentity: AuthorizationContext;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EligibilityService(mockEligibilityRepository, mockAuditRepository);

    // Mock authorized identity with eligibility.decide permission
    mockIdentity = {
      userId: "user-123",
      roles: ["VERIFIER"],
      permissions: new Set(["eligibility.view", "eligibility.decide"]),
      contingentIds: ["contingent-1"],
      teamIds: ["team-1"],
      canViewAllContingents: false,
      canViewAllTeams: false,
      canViewAllPlayers: false,
      canDecideAllPlayers: false,
    };
  });

  describe("listPlayers", () => {
    it("should deny access without eligibility.view permission", async () => {
      const unauthorizedIdentity: AuthorizationContext = {
        ...mockIdentity,
        permissions: new Set(),
      };

      await expect(() => service.listPlayers(unauthorizedIdentity)).rejects.toThrow(
        /unauthorized/i,
      );
    });

    it("should return player list with eligibility.view permission", async () => {
      const mockPlayers: AdminPlayerListDto[] = [
        {
          id: "p1",
          name: "Player One",
          teamId: "team-1",
          teamName: "Team A",
          number: "10",
          position: "FW",
          birthYear: "2000",
          identityDisplay: "",
          status: "VERIFIED",
          eligibility: "PENDING",
        },
      ];

      vi.mocked(mockEligibilityRepository.listPlayersWithEligibility).mockResolvedValue(
        mockPlayers,
      );

      const result = await service.listPlayers(mockIdentity);

      expect(result).toEqual(mockPlayers);
      expect(mockEligibilityRepository.listPlayersWithEligibility).toHaveBeenCalled();
    });
  });

  describe("getPlayerEligibility", () => {
    it("should deny access without eligibility.view permission", async () => {
      const unauthorizedIdentity: AuthorizationContext = {
        ...mockIdentity,
        permissions: new Set(),
      };

      await expect(() => service.getPlayerEligibility(unauthorizedIdentity, "p1")).rejects.toThrow(
        /unauthorized/i,
      );
    });

    it("should return player with eligibility data", async () => {
      const mockPlayer: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      vi.mocked(mockEligibilityRepository.getPlayerById).mockResolvedValue(mockPlayer);

      const result = await service.getPlayerEligibility(mockIdentity, "p1");

      expect(result).toEqual(mockPlayer);
      expect(mockEligibilityRepository.getPlayerById).toHaveBeenCalledWith("p1");
    });

    it("should return null for non-existent player", async () => {
      vi.mocked(mockEligibilityRepository.getPlayerById).mockResolvedValue(null);

      const result = await service.getPlayerEligibility(mockIdentity, "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("evaluatePlayerEligibility", () => {
    it("should fail when team is missing", () => {
      const player: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "",
        teamName: "",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      expect(() => service.evaluatePlayerEligibility(player)).toThrow(/team/i);
    });

    it("should fail when registration status is not VERIFIED", () => {
      const player: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "DRAFT",
        eligibility: "PENDING",
      };

      expect(() => service.evaluatePlayerEligibility(player)).toThrow(
        /registration|verified/i,
      );
    });

    it("should fail when required data is missing", () => {
      const playerMissingName: AdminPlayerListDto = {
        id: "p1",
        name: "",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      expect(() => service.evaluatePlayerEligibility(playerMissingName)).toThrow(
        /required data/i,
      );

      const playerMissingPosition: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      expect(() => service.evaluatePlayerEligibility(playerMissingPosition)).toThrow(
        /required data/i,
      );
    });

    it("should return VERIFIED_AND_ELIGIBLE when all rules pass", () => {
      const player: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      const result = service.evaluatePlayerEligibility(player);

      expect(result.eligible).toBe(true);
      expect(result.reasons).toContain("VERIFIED_AND_ELIGIBLE");
    });
  });

  describe("decideEligibility", () => {
    it("should deny access without eligibility.decide permission", async () => {
      const unauthorizedIdentity: AuthorizationContext = {
        ...mockIdentity,
        permissions: new Set(["eligibility.view"]), // Missing eligibility.decide
      };

      await expect(() =>
        service.decideEligibility(unauthorizedIdentity, {
          playerId: "p1",
          targetStatus: "ELIGIBLE",
        }),
      ).rejects.toThrow(/unauthorized/i);
    });

    it("should throw for invalid state transition", async () => {
      const mockPlayer: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "ELIGIBLE", // Current state
      };

      vi.mocked(mockEligibilityRepository.getPlayerById).mockResolvedValue(mockPlayer);

      // Try to transition from ELIGIBLE to ELIGIBLE (invalid)
      await expect(() =>
        service.decideEligibility(mockIdentity, {
          playerId: "p1",
          targetStatus: "ELIGIBLE",
        }),
      ).rejects.toThrow(/transition|invalid/i);
    });

    it("should create audit record when marking player as ELIGIBLE", async () => {
      const mockPlayer: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      const updatedPlayer: AdminPlayerListDto = {
        ...mockPlayer,
        eligibility: "ELIGIBLE",
      };

      vi.mocked(mockEligibilityRepository.getPlayerById).mockResolvedValue(mockPlayer);
      vi.mocked(mockEligibilityRepository.updatePlayerEligibility).mockResolvedValue(
        updatedPlayer,
      );

      await service.decideEligibility(mockIdentity, {
        playerId: "p1",
        targetStatus: "ELIGIBLE",
      });

      expect(mockAuditRepository.append).toHaveBeenCalled();
      const auditCall = vi.mocked(mockAuditRepository.append).mock.calls[0];
      const auditRecord = auditCall[0];

      expect(auditRecord.actor).toBe("user-123");
      expect(auditRecord.action).toBe("APPROVE");
      expect(auditRecord.resource).toBe("player_eligibility");
      expect(auditRecord.before).toEqual({ eligibility: "PENDING" });
      expect(auditRecord.after).toEqual({ eligibility: "ELIGIBLE" });
    });

    it("should create audit record when marking player as NOT_ELIGIBLE", async () => {
      const mockPlayer: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      const updatedPlayer: AdminPlayerListDto = {
        ...mockPlayer,
        eligibility: "NOT_ELIGIBLE",
      };

      vi.mocked(mockEligibilityRepository.getPlayerById).mockResolvedValue(mockPlayer);
      vi.mocked(mockEligibilityRepository.updatePlayerEligibility).mockResolvedValue(
        updatedPlayer,
      );

      await service.decideEligibility(mockIdentity, {
        playerId: "p1",
        targetStatus: "NOT_ELIGIBLE",
      });

      expect(mockAuditRepository.append).toHaveBeenCalled();
      const auditCall = vi.mocked(mockAuditRepository.append).mock.calls[0];
      const auditRecord = auditCall[0];

      expect(auditRecord.action).toBe("REJECT");
      expect(auditRecord.before).toEqual({ eligibility: "PENDING" });
      expect(auditRecord.after).toEqual({ eligibility: "NOT_ELIGIBLE" });
    });

    it("should update player eligibility and return updated data", async () => {
      const mockPlayer: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      const updatedPlayer: AdminPlayerListDto = {
        ...mockPlayer,
        eligibility: "ELIGIBLE",
      };

      vi.mocked(mockEligibilityRepository.getPlayerById).mockResolvedValue(mockPlayer);
      vi.mocked(mockEligibilityRepository.updatePlayerEligibility).mockResolvedValue(
        updatedPlayer,
      );

      const result = await service.decideEligibility(mockIdentity, {
        playerId: "p1",
        targetStatus: "ELIGIBLE",
      });

      expect(result).toEqual(updatedPlayer);
      expect(mockEligibilityRepository.updatePlayerEligibility).toHaveBeenCalledWith(
        "p1",
        "ELIGIBLE",
        undefined,
        undefined,
      );
    });

    it("should include reason and notes in decision", async () => {
      const mockPlayer: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "",
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      const updatedPlayer: AdminPlayerListDto = {
        ...mockPlayer,
        eligibility: "NOT_ELIGIBLE",
      };

      vi.mocked(mockEligibilityRepository.getPlayerById).mockResolvedValue(mockPlayer);
      vi.mocked(mockEligibilityRepository.updatePlayerEligibility).mockResolvedValue(
        updatedPlayer,
      );

      await service.decideEligibility(mockIdentity, {
        playerId: "p1",
        targetStatus: "NOT_ELIGIBLE",
        reason: "Age restriction",
        notes: "Player too young for this category",
      });

      expect(mockEligibilityRepository.updatePlayerEligibility).toHaveBeenCalledWith(
        "p1",
        "NOT_ELIGIBLE",
        "Age restriction",
        "Player too young for this category",
      );
    });
  });

  describe("Privacy and DTO validation", () => {
    it("should not expose PII in returned DTOs", async () => {
      const mockPlayer: AdminPlayerListDto = {
        id: "p1",
        name: "Player One",
        teamId: "team-1",
        teamName: "Team A",
        number: "10",
        position: "FW",
        birthYear: "2000",
        identityDisplay: "", // Must be empty
        status: "VERIFIED",
        eligibility: "PENDING",
      };

      vi.mocked(mockEligibilityRepository.getPlayerById).mockResolvedValue(mockPlayer);

      const result = await service.getPlayerEligibility(mockIdentity, "p1");

      expect(result?.identityDisplay).toBe("");
    });
  });
});
