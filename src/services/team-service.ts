import { assertAuthorized, type AuthenticatedIdentity } from "@/lib/authorization";
import { createAuditRecord, type AuditRepository } from "@/lib/audit";
import { validateTransition } from "@/lib/state-machine";
import type { Contingent, Team } from "@/types/domain";
import type {
  ContingentReadRepository,
  TeamCreateInput,
  TeamReadRepository,
  TeamRepository,
  TeamUpdateInput,
} from "@/repositories/contracts";

function validateText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`Invalid team ${field}`);
  return normalized;
}

function validateCategory(value: string): Team["category"] {
  if (value !== "PUTRA" && value !== "PUTRI") throw new Error("Invalid team category");
  return value;
}

function auditSnapshot(team: Team): Record<string, unknown> {
  return {
    id: team.id,
    contingentId: team.contingentId,
    category: team.category,
    name: team.name,
    shortName: team.shortName,
    manager: team.manager,
    headCoach: team.headCoach,
    status: team.status,
  };
}

export class TeamService {
  constructor(
    private readonly repository: TeamReadRepository | TeamRepository,
    private readonly contingentRepository?: ContingentReadRepository,
    private readonly auditRepository?: AuditRepository,
  ) {}

  async list(identity: AuthenticatedIdentity): Promise<Team[]> {
    assertAuthorized(identity, "team.view");
    return this.repository.list();
  }

  async getById(identity: AuthenticatedIdentity, id: string): Promise<Team | null> {
    assertAuthorized(identity, "team.view");
    const team = await this.repository.getById(id);
    if (!team) return null;
    assertAuthorized(identity, "team.view", {
      scope: "TEAM",
      teamId: team.id,
      contingentId: team.contingentId,
    });
    return team;
  }

  async create(identity: AuthenticatedIdentity, input: TeamCreateInput): Promise<Team> {
    const repository = this.mutableRepository();
    const contingent = await this.requireContingent(input.contingentId);
    assertAuthorized(identity, "team.create", this.contingentResource(contingent));

    const created = await repository.create({
      contingentId: contingent.id,
      category: validateCategory(input.category),
      name: validateText(input.name, "name", 160),
      shortName: validateText(input.shortName, "short name", 64),
      manager: validateText(input.manager, "manager", 120),
      headCoach: validateText(input.headCoach, "head coach", 120),
    });
    await this.audit().append(createAuditRecord({
      actor: identity.userId,
      action: "CREATE",
      resource: "team",
      resourceId: created.id,
      after: auditSnapshot(created),
    }));
    return created;
  }

  async update(identity: AuthenticatedIdentity, id: string, input: TeamUpdateInput): Promise<Team> {
    const repository = this.mutableRepository();
    const current = await repository.getById(id);
    if (!current) throw new Error("Team not found");
    assertAuthorized(identity, "team.update", {
      scope: "TEAM",
      teamId: current.id,
      contingentId: current.contingentId,
    });

    const validated: TeamUpdateInput = {};
    if (input.name !== undefined) validated.name = validateText(input.name, "name", 160);
    if (input.shortName !== undefined) validated.shortName = validateText(input.shortName, "short name", 64);
    if (input.manager !== undefined) validated.manager = validateText(input.manager, "manager", 120);
    if (input.headCoach !== undefined) validated.headCoach = validateText(input.headCoach, "head coach", 120);
    if (!Object.keys(validated).length) throw new Error("No mutable team fields provided");

    const updated = await repository.update(id, validated);
    await this.audit().append(createAuditRecord({
      actor: identity.userId,
      action: "UPDATE",
      resource: "team",
      resourceId: id,
      before: auditSnapshot(current),
      after: auditSnapshot(updated),
    }));
    return updated;
  }

  async transitionStatus(
    identity: AuthenticatedIdentity,
    id: string,
    targetStatus: Team["status"],
  ): Promise<Team> {
    const repository = this.mutableRepository();
    const current = await repository.getById(id);
    if (!current) throw new Error("Team not found");
    assertAuthorized(identity, "team.update", {
      scope: "TEAM",
      teamId: current.id,
      contingentId: current.contingentId,
    });
    validateTransition("registration", current.status, targetStatus);
    const updated = await repository.transitionStatus(id, targetStatus);
    await this.audit().append(createAuditRecord({
      actor: identity.userId,
      action: targetStatus === "SUBMITTED" ? "SUBMIT" : "UPDATE",
      resource: "team",
      resourceId: id,
      before: { status: current.status },
      after: { status: updated.status },
    }));
    return updated;
  }

  private mutableRepository(): TeamRepository {
    if (!("create" in this.repository && "update" in this.repository && "transitionStatus" in this.repository)) {
      throw new Error("Team mutation repository is unavailable");
    }
    return this.repository;
  }

  private async requireContingent(id: string): Promise<Contingent> {
    if (!this.contingentRepository) throw new Error("Contingent relationship repository is unavailable");
    const contingent = await this.contingentRepository.getById(id);
    if (!contingent) throw new Error("Invalid team contingent");
    return contingent;
  }

  private contingentResource(contingent: Contingent) {
    return {
      scope: "CONTINGENT" as const,
      contingentId: contingent.id,
      ...(contingent.eventId ? { eventId: contingent.eventId } : {}),
      ...(contingent.sportId ? { sportId: contingent.sportId } : {}),
    };
  }

  private audit(): AuditRepository {
    if (!this.auditRepository) throw new Error("Team audit repository is unavailable");
    return this.auditRepository;
  }
}
