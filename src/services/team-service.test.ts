import { describe, expect, it } from "bun:test";
import { TeamService } from "@/services/team-service";
import type { AuditRecord, AuditRepository } from "@/lib/audit";
import type { Contingent } from "@/types/domain";
import type { Team } from "@/types/domain";
import type { ContingentReadRepository, TeamRepository } from "@/repositories/contracts";

const teamA: Team = {
  id: "team-a",
  contingentId: "contingent-a",
  category: "PUTRA",
  name: "Tim A",
  shortName: "A",
  manager: "Manager A",
  headCoach: "Coach A",
  groupId: "group-a",
  status: "ACTIVE",
  eligibility: "ELIGIBLE",
};

function repository(team: Team = teamA): TeamRepository {
  let current = team;
  return {
    list: async () => [current],
    getById: async (id) => id === current.id ? current : null,
    create: async (input) => {
      current = { ...teamA, ...input, id: "team-new", status: "DRAFT", eligibility: "PENDING", groupId: "" };
      return current;
    },
    update: async (_id, input) => { current = { ...current, ...input }; return current; },
    transitionStatus: async (_id, status) => { current = { ...current, status }; return current; },
    delete: async () => undefined,
  };
}

const contingentA: Contingent = {
  id: "contingent-a", eventId: "event-a", sportId: "sport-a", code: "AAA", name: "Kontingen A",
  region: "Makassar", pic: "PIC A", email: "pic@example.test", phone: "0800000000", status: "DRAFT",
  documents: 0, verifiedDocuments: 0,
};

function contingents(contingent: Contingent | null = contingentA): ContingentReadRepository {
  return { list: async () => contingent ? [contingent] : [], getById: async (id) => id === contingent?.id ? contingent : null };
}

function audits(records: AuditRecord[]): AuditRepository {
  return { append: async (record) => { records.push(record); } };
}

describe("TeamService", () => {
  it("denies an authenticated identity without team.view", async () => {
    const service = new TeamService(repository());
    await expect(service.list({ userId: "user-a", roles: [], permissions: [], scopes: [] })).rejects.toThrow("MISSING_PERMISSION");
  });

  it("denies a team resource outside a team scope", async () => {
    const service = new TeamService(repository());
    await expect(service.getById({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["team.view"], scopes: [{ scope: "TEAM", scopeId: "team-b" }] }, "team-a")).rejects.toThrow("RESOURCE_OUTSIDE_SCOPE");
  });

  it("allows a contingent-scoped identity to read its team", async () => {
    const service = new TeamService(repository());
    const team = await service.getById({ userId: "user-a", roles: ["CONTINGENT_ADMIN"], permissions: ["team.view"], scopes: [{ scope: "CONTINGENT", scopeId: "contingent-a" }], contingentIds: ["contingent-a"] }, "team-a");
    expect(team?.id).toBe("team-a");
  });

  it("denies create without team.create", async () => {
    const service = new TeamService(repository(), contingents(), audits([]));
    await expect(service.create(
      { userId: "user-a", roles: ["CONTINGENT_ADMIN"], permissions: [], scopes: [{ scope: "CONTINGENT", scopeId: "contingent-a" }] },
      { contingentId: "contingent-a", category: "PUTRA", name: "Tim Baru", shortName: "BARU", manager: "Manager", headCoach: "Coach" },
    )).rejects.toThrow("MISSING_PERMISSION");
  });

  it("denies create outside the target contingent scope", async () => {
    const service = new TeamService(repository(), contingents(), audits([]));
    await expect(service.create(
      { userId: "user-a", roles: ["CONTINGENT_ADMIN"], permissions: ["team.create"], scopes: [{ scope: "CONTINGENT", scopeId: "contingent-b" }] },
      { contingentId: "contingent-a", category: "PUTRA", name: "Tim Baru", shortName: "BARU", manager: "Manager", headCoach: "Coach" },
    )).rejects.toThrow("RESOURCE_OUTSIDE_SCOPE");
  });

  it("creates a team in scope with draft status and an audit record", async () => {
    const records: AuditRecord[] = [];
    const service = new TeamService(repository(), contingents(), audits(records));
    const created = await service.create(
      { userId: "user-a", roles: ["CONTINGENT_ADMIN"], permissions: ["team.create"], scopes: [{ scope: "CONTINGENT", scopeId: "contingent-a" }] },
      { contingentId: "contingent-a", category: "PUTRA", name: " Tim Baru ", shortName: " BARU ", manager: " Manager ", headCoach: " Coach " },
    );
    expect(created.status).toBe("DRAFT");
    expect(records[0]?.action).toBe("CREATE");
  });

  it("denies update outside the assigned team scope", async () => {
    const service = new TeamService(repository(), contingents(), audits([]));
    await expect(service.update(
      { userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["team.update"], scopes: [{ scope: "TEAM", scopeId: "team-b" }] },
      "team-a", { name: "Tidak boleh" },
    )).rejects.toThrow("RESOURCE_OUTSIDE_SCOPE");
  });

  it("updates an assigned team and records the change", async () => {
    const records: AuditRecord[] = [];
    const service = new TeamService(repository(), contingents(), audits(records));
    const updated = await service.update(
      { userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["team.update"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] },
      "team-a", { name: "Tim Baru" },
    );
    expect(updated.name).toBe("Tim Baru");
    expect(records[0]?.action).toBe("UPDATE");
  });

  it("does not expose contingent reassignment through the team update contract", async () => {
    const service = new TeamService(repository(), contingents(), audits([]));
    await expect(service.update(
      { userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["team.update"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] },
      "team-a", {},
    )).rejects.toThrow("No mutable team fields provided");
  });

  it("rejects invalid status transitions", async () => {
    const service = new TeamService(repository(), contingents(), audits([]));
    await expect(service.transitionStatus(
      { userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["team.update"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] },
      "team-a", "ACTIVE",
    )).rejects.toThrow("Invalid registration transition");
  });

  it("transitions a valid status and audits it", async () => {
    const records: AuditRecord[] = [];
    const service = new TeamService(repository({ ...teamA, status: "DRAFT" }), contingents(), audits(records));
    const updated = await service.transitionStatus(
      { userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["team.update"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] },
      "team-a", "SUBMITTED",
    );
    expect(updated.status).toBe("SUBMITTED");
    expect(records[0]?.action).toBe("SUBMIT");
  });
});
