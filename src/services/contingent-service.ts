import { assertAuthorized, hasPermission, type AuthenticatedIdentity } from "@/lib/authorization";
import { createAuditRecord, type AuditRepository } from "@/lib/audit";
import { validateTransition } from "@/lib/state-machine";
import type { Contingent } from "@/types/domain";
import type {
  ContingentCreateInput,
  ContingentRepository,
  ContingentUpdateInput,
} from "@/repositories/contracts";

function validateText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`Invalid contingent ${field}`);
  return normalized;
}

function validateEmail(value: string): string {
  const email = validateText(value, "email", 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid contingent email");
  return email;
}

function auditSnapshot(contingent: Contingent): Record<string, unknown> {
  return {
    id: contingent.id,
    eventId: contingent.eventId,
    sportId: contingent.sportId,
    code: contingent.code,
    name: contingent.name,
    region: contingent.region,
    status: contingent.status,
  };
}

export class ContingentService {
  constructor(
    private readonly repository: ContingentRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  async list(identity: AuthenticatedIdentity): Promise<Contingent[]> {
    assertAuthorized(identity, "contingent.view");
    return this.repository.list();
  }

  async create(identity: AuthenticatedIdentity, input: ContingentCreateInput): Promise<Contingent> {
    if (!hasPermission(identity, "contingent.create")) {
      throw new Error("Authorization denied: MISSING_PERMISSION");
    }
    const hasTargetScope = identity.roles.includes("SUPER_ADMIN")
      || identity.eventIds?.includes(input.eventId) === true
      || identity.sportIds?.includes(input.sportId) === true;
    if (!hasTargetScope) throw new Error("Authorization denied: RESOURCE_OUTSIDE_SCOPE");

    const validated: ContingentCreateInput = {
      eventId: validateText(input.eventId, "event", 64),
      sportId: validateText(input.sportId, "sport", 64),
      code: validateText(input.code, "code", 32).toUpperCase(),
      name: validateText(input.name, "name", 160),
      region: validateText(input.region, "region", 120),
      pic: validateText(input.pic, "pic", 120),
      email: validateEmail(input.email),
      phone: validateText(input.phone, "phone", 32),
    };
    if (input.logoPath !== undefined) validated.logoPath = validateText(input.logoPath, "logo path", 512);

    const created = await this.repository.create(validated);
    await this.auditRepository.append(createAuditRecord({
      actor: identity.userId,
      action: "CREATE",
      resource: "contingent",
      resourceId: created.id,
      after: auditSnapshot(created),
    }));
    return created;
  }

  async update(
    identity: AuthenticatedIdentity,
    id: string,
    input: ContingentUpdateInput,
  ): Promise<Contingent> {
    const current = await this.repository.getById(id);
    if (!current) throw new Error("Contingent not found");
    assertAuthorized(identity, "contingent.update", {
      scope: "CONTINGENT",
      ...(current.eventId ? { eventId: current.eventId } : {}),
      ...(current.sportId ? { sportId: current.sportId } : {}),
      contingentId: id,
    });

    const validated: ContingentUpdateInput = {};
    if (input.name !== undefined) validated.name = validateText(input.name, "name", 160);
    if (input.region !== undefined) validated.region = validateText(input.region, "region", 120);
    if (input.pic !== undefined) validated.pic = validateText(input.pic, "pic", 120);
    if (input.email !== undefined) validated.email = validateEmail(input.email);
    if (input.phone !== undefined) validated.phone = validateText(input.phone, "phone", 32);
    if (input.logoPath !== undefined) validated.logoPath = validateText(input.logoPath, "logo path", 512);
    const updated = await this.repository.update(id, validated);
    await this.auditRepository.append(createAuditRecord({
      actor: identity.userId,
      action: "UPDATE",
      resource: "contingent",
      resourceId: id,
      before: auditSnapshot(current),
      after: auditSnapshot(updated),
    }));
    return updated;
  }

  async transitionStatus(
    identity: AuthenticatedIdentity,
    id: string,
    targetStatus: Contingent["status"],
  ): Promise<Contingent> {
    const current = await this.repository.getById(id);
    if (!current) throw new Error("Contingent not found");
    assertAuthorized(identity, "contingent.update", {
      scope: "CONTINGENT",
      ...(current.eventId ? { eventId: current.eventId } : {}),
      ...(current.sportId ? { sportId: current.sportId } : {}),
      contingentId: id,
    });
    validateTransition("registration", current.status, targetStatus);
    const updated = await this.repository.transitionStatus(id, targetStatus);
    await this.auditRepository.append(createAuditRecord({
      actor: identity.userId,
      action: targetStatus === "SUBMITTED" ? "SUBMIT" : "UPDATE",
      resource: "contingent",
      resourceId: id,
      before: { status: current.status },
      after: { status: updated.status },
    }));
    return updated;
  }
}