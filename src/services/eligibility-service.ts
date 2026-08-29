import { assertAuthorized, type AuthenticatedIdentity } from "@/lib/authorization";
import type { AdminPlayerListDto } from "@/lib/dto";
import type { EligibilityRepository } from "@/repositories/contracts";
import { validateTransition } from "@/lib/state-machine";
import { createAuditRecord, type AuditRepository } from "@/lib/audit";
import type { EligibilityStatus, Player } from "@/types/domain";

export type EligibilityReason =
  | "TEAM_MISSING"
  | "CONTINGENT_MISSING"
  | "REGISTRATION_INCOMPLETE"
  | "REQUIRED_DATA_MISSING"
  | "VERIFIED_AND_ELIGIBLE";

export interface EligibilityEvaluationResult {
  playerId: string;
  eligible: boolean;
  status: EligibilityStatus;
  reasons: EligibilityReason[];
}

export interface EligibilityDecisionInput {
  playerId: string;
  targetStatus: "ELIGIBLE" | "NOT_ELIGIBLE";
  reason?: string;
  notes?: string;
}

export class EligibilityService {
  constructor(
    private readonly repository: EligibilityRepository,
    private readonly auditRepository?: AuditRepository,
  ) {}

  async listPlayers(identity: AuthenticatedIdentity): Promise<AdminPlayerListDto[]> {
    assertAuthorized(identity, "eligibility.view");
    return this.repository.listPlayersWithEligibility();
  }

  async getPlayerEligibility(identity: AuthenticatedIdentity, playerId: string): Promise<EligibilityEvaluationResult | null> {
    assertAuthorized(identity, "eligibility.view");
    const player = await this.repository.getPlayerById(playerId);
    if (!player) return null;
    return this.evaluatePlayerEligibility(player);
  }

  async evaluatePlayerEligibility(player: AdminPlayerListDto): Promise<EligibilityEvaluationResult> {
    const reasons: EligibilityReason[] = [];
    let eligible = true;

    // Rule 1: Team must exist
    if (!player.teamId || !player.teamName) {
      reasons.push("TEAM_MISSING");
      eligible = false;
    }

    // Rule 2: Contingent must be accessible (implicit through team relationship)
    if (!player.contingentName && eligible) {
      reasons.push("CONTINGENT_MISSING");
      eligible = false;
    }

    // Rule 3: Registration status must be VERIFIED
    if (player.status !== "VERIFIED" && eligible) {
      reasons.push("REGISTRATION_INCOMPLETE");
      eligible = false;
    }

    // Rule 4: Required data must be present
    if (eligible && (!player.name || !player.number || !player.position || player.birthYear === "")) {
      reasons.push("REQUIRED_DATA_MISSING");
      eligible = false;
    }

    // If all rules pass, player is eligible
    if (eligible && reasons.length === 0) {
      reasons.push("VERIFIED_AND_ELIGIBLE");
    }

    return {
      playerId: player.id,
      eligible,
      status: eligible ? "ELIGIBLE" : "NOT_ELIGIBLE",
      reasons,
    };
  }

  async decideEligibility(
    identity: AuthenticatedIdentity,
    input: EligibilityDecisionInput,
  ): Promise<AdminPlayerListDto> {
    assertAuthorized(identity, "eligibility.decide");

    // Load current player state
    const player = await this.repository.getPlayerById(input.playerId);
    if (!player) throw new Error("Player not found");

    // Validate authorization scope
    assertAuthorized(identity, "eligibility.decide", {
      scope: "TEAM",
      teamId: player.teamId,
      contingentId: player.contingentName ? player.id : undefined,
    });

    // Validate state machine transition
    const currentStatus = player.eligibility;
    validateTransition("eligibility", currentStatus, input.targetStatus);

    // Apply decision
    const updated = await this.repository.updatePlayerEligibility(
      input.playerId,
      input.targetStatus,
      input.reason,
      input.notes,
    );

    // Create audit record
    if (this.auditRepository) {
      await this.auditRepository.append(
        createAuditRecord({
          actor: identity.userId,
          action: input.targetStatus === "ELIGIBLE" ? "APPROVE" : "REJECT",
          resource: "player_eligibility",
          resourceId: input.playerId,
          before: { eligibility: currentStatus },
          after: { eligibility: input.targetStatus },
        }),
      );
    }

    return updated;
  }
}
