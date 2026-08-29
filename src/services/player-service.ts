import { assertAuthorized, authorize, type AuthenticatedIdentity } from "@/lib/authorization";
import type { AdminPlayerListDto } from "@/lib/dto";
import type { PlayerReadRecord, PlayerReadRepository } from "@/repositories/contracts";
import type { PlayerCreateInput, PlayerRepository, PlayerUpdateInput, TeamReadRepository } from "@/repositories/contracts";
import { createAuditRecord, type AuditRepository } from "@/lib/audit";
import { validateTransition } from "@/lib/state-machine";
import type { Player } from "@/types/domain";

function toAdminDto(player: PlayerReadRecord): AdminPlayerListDto {
  const { contingentId: _contingentId, ...dto } = player;
  return dto;
}

export class PlayerService {
  constructor(
    private readonly repository: PlayerReadRepository | PlayerRepository,
    private readonly teamRepository?: TeamReadRepository,
    private readonly auditRepository?: AuditRepository,
  ) {}

  async list(identity: AuthenticatedIdentity): Promise<AdminPlayerListDto[]> {
    assertAuthorized(identity, "player.view");
    const players = await this.repository.list();
    return players
      .filter((player) => authorize(identity, "player.view", {
        scope: "TEAM",
        teamId: player.teamId,
        contingentId: player.contingentId,
      }).allowed)
      .map(toAdminDto);
  }

  async getById(identity: AuthenticatedIdentity, id: string): Promise<AdminPlayerListDto | null> {
    assertAuthorized(identity, "player.view");
    const player = await this.repository.getById(id);
    if (!player) return null;
    assertAuthorized(identity, "player.view", {
      scope: "TEAM",
      teamId: player.teamId,
      contingentId: player.contingentId,
    });
    return toAdminDto(player);
  }

  async create(identity: AuthenticatedIdentity, input: PlayerCreateInput): Promise<AdminPlayerListDto> {
    const repository = this.mutableRepository();
    const team = await this.requireTeam(input.teamId);
    assertAuthorized(identity, "player.create", { scope: "TEAM", teamId: team.id, contingentId: team.contingentId });
    const created = await repository.create({
      teamId: team.id,
      name: validateText(input.name, "name", 160),
      number: validateNumber(input.number),
      position: validatePosition(input.position),
      birthDate: validateBirthDate(input.birthDate),
      identityType: validateIdentityType(input.identityType),
      identityNumber: validateIdentityNumber(input.identityNumber, input.identityType),
    });
    await this.audit().append(createAuditRecord({
      actor: identity.userId, action: "CREATE", resource: "player", resourceId: created.id,
      after: playerAuditSnapshot(created),
    }));
    return toAdminDto(created);
  }

  async update(identity: AuthenticatedIdentity, id: string, input: PlayerUpdateInput): Promise<AdminPlayerListDto> {
    const repository = this.mutableRepository();
    const current = await repository.getById(id);
    if (!current) throw new Error("Player not found");
    assertAuthorized(identity, "player.update", { scope: "TEAM", teamId: current.teamId, contingentId: current.contingentId });
    const validated: PlayerUpdateInput = {};
    if (input.name !== undefined) validated.name = validateText(input.name, "name", 160);
    if (input.number !== undefined) validated.number = validateNumber(input.number);
    if (input.position !== undefined) validated.position = validatePosition(input.position);
    if (!Object.keys(validated).length) throw new Error("No mutable player fields provided");
    const updated = await repository.update(id, validated);
    await this.audit().append(createAuditRecord({
      actor: identity.userId, action: "UPDATE", resource: "player", resourceId: id,
      before: playerAuditSnapshot(current), after: playerAuditSnapshot(updated),
    }));
    return toAdminDto(updated);
  }

  async transitionStatus(identity: AuthenticatedIdentity, id: string, targetStatus: Player["status"]): Promise<AdminPlayerListDto> {
    const repository = this.mutableRepository();
    const current = await repository.getById(id);
    if (!current) throw new Error("Player not found");
    assertAuthorized(identity, "player.update", { scope: "TEAM", teamId: current.teamId, contingentId: current.contingentId });
    validateTransition("registration", current.status, targetStatus);
    const updated = await repository.transitionStatus(id, targetStatus);
    await this.audit().append(createAuditRecord({
      actor: identity.userId, action: targetStatus === "SUBMITTED" ? "SUBMIT" : "UPDATE", resource: "player", resourceId: id,
      before: { status: current.status }, after: { status: updated.status },
    }));
    return toAdminDto(updated);
  }

  private mutableRepository(): PlayerRepository {
    if (!("create" in this.repository && "update" in this.repository && "transitionStatus" in this.repository)) {
      throw new Error("Player mutation repository is unavailable");
    }
    return this.repository;
  }

  private async requireTeam(id: string) {
    if (!this.teamRepository) throw new Error("Player team repository is unavailable");
    const team = await this.teamRepository.getById(id);
    if (!team) throw new Error("Invalid player team");
    return team;
  }

  private audit(): AuditRepository {
    if (!this.auditRepository) throw new Error("Player audit repository is unavailable");
    return this.auditRepository;
  }
}

function validateText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`Invalid player ${field}`);
  return normalized;
}
function validateNumber(value: number): number { if (!Number.isInteger(value) || value < 1 || value > 99) throw new Error("Invalid player number"); return value; }
function validatePosition(value: string): Player["position"] {
  if (!["PENJAGA GAWANG", "ANCHOR", "FLANK", "PIVOT"].includes(value)) throw new Error("Invalid player position");
  return value as Player["position"];
}
function validateBirthDate(value: string): string { if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new Error("Invalid player birth date"); return value; }
function validateIdentityType(value: string): PlayerCreateInput["identityType"] { if (value !== "NIK" && value !== "PASSPORT") throw new Error("Invalid player identity type"); return value; }
function validateIdentityNumber(value: string, type: PlayerCreateInput["identityType"]): string {
  const normalized = value.trim().toUpperCase();
  const valid = type === "NIK" ? /^\d{16}$/.test(normalized) : /^[A-Z0-9]{6,20}$/.test(normalized);
  if (!valid) throw new Error("Invalid player identity number");
  return normalized;
}
function playerAuditSnapshot(player: PlayerReadRecord): Record<string, unknown> { return { id: player.id, teamId: player.teamId, name: player.name, number: player.number, position: player.position, status: player.status }; }
