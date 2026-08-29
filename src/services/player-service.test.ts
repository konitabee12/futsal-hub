import { describe, expect, it } from "bun:test";
import { PlayerService } from "@/services/player-service";
import type { PlayerCreateInput, PlayerReadRecord, PlayerReadRepository, PlayerRepository, PlayerUpdateInput, TeamReadRepository } from "@/repositories/contracts";
import type { AuditRecord, AuditRepository } from "@/lib/audit";

const playerA: PlayerReadRecord = {
  id: "player-a",
  teamId: "team-a",
  contingentId: "contingent-a",
  teamName: "Tim A",
  name: "Pemain A",
  number: 10,
  position: "ANCHOR",
  birthYear: "2004",
  identityDisplay: "NIK ••••1234",
  status: "VERIFIED",
  eligibility: "ELIGIBLE",
};

const playerB: PlayerReadRecord = { ...playerA, id: "player-b", teamId: "team-b", contingentId: "contingent-b", teamName: "Tim B" };

function repository(players: PlayerReadRecord[] = [playerA, playerB]): PlayerReadRepository {
  return {
    list: async () => players,
    getById: async (id) => players.find((player) => player.id === id) ?? null,
  };
}

describe("PlayerService", () => {
  it("denies an anonymous-equivalent identity", async () => {
    await expect(new PlayerService(repository()).list({ userId: "", roles: [], permissions: [], scopes: [] }))
      .rejects.toThrow("MISSING_PERMISSION");
  });

  it("denies an authenticated identity without player.view", async () => {
    await expect(new PlayerService(repository()).list({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: [], scopes: [] }))
      .rejects.toThrow("MISSING_PERMISSION");
  });

  it("does not return players outside an assigned team scope", async () => {
    const players = await new PlayerService(repository()).list({
      userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["player.view"],
      scopes: [{ scope: "TEAM", scopeId: "team-b" }],
    });
    expect(players).toEqual([expect.objectContaining({ id: "player-b" })]);
  });

  it("allows a player in the assigned team scope", async () => {
    const player = await new PlayerService(repository()).getById({
      userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["player.view"],
      scopes: [{ scope: "TEAM", scopeId: "team-a" }],
    }, "player-a");
    expect(player?.teamName).toBe("Tim A");
  });

  it("allows a contingent-scoped identity to read its players", async () => {
    const players = await new PlayerService(repository()).list({
      userId: "user-a", roles: ["CONTINGENT_ADMIN"], permissions: ["player.view"],
      scopes: [{ scope: "CONTINGENT", scopeId: "contingent-a" }],
    });
    expect(players).toHaveLength(1);
    expect(players[0]?.id).toBe("player-a");
  });

  it("returns only the admin-safe DTO", async () => {
    const player = await new PlayerService(repository([playerA])).getById({
      userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["player.view"],
      scopes: [{ scope: "TEAM", scopeId: "team-a" }],
    }, "player-a");
    expect(player).toEqual(expect.objectContaining({ identityDisplay: "NIK ••••1234", birthYear: "2004" }));
    expect(player).not.toHaveProperty("contingentId");
    expect(player).not.toHaveProperty("identityNumber");
    expect(player).not.toHaveProperty("birthDate");
  });

  it("creates with server-derived registration and eligibility state", async () => {
    const audits: AuditRecord[] = [];
    const created: PlayerReadRecord = { ...playerA, id: "player-new", name: "New Player", status: "DRAFT", eligibility: "PENDING" };
    const mutable: PlayerRepository = {
      ...repository([playerA]),
      create: async (_input: PlayerCreateInput) => created,
      update: async () => created,
      transitionStatus: async () => created,
    };
    const teams: TeamReadRepository = { list: async () => [], getById: async () => ({ id: "team-a", contingentId: "contingent-a", category: "PUTRA", name: "Tim A", shortName: "A", manager: "Manager", headCoach: "Coach", groupId: "", status: "DRAFT", eligibility: "PENDING" }) };
    const audit: AuditRepository = { append: async (record) => { audits.push(record); } };
    const result = await new PlayerService(mutable, teams, audit).create(
      { userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["player.create"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] },
      { teamId: "team-a", name: "New Player", number: 7, position: "ANCHOR", birthDate: "2004-01-01", identityType: "NIK", identityNumber: "1234567890123456" },
    );
    expect(result.status).toBe("DRAFT");
    expect(result.eligibility).toBe("PENDING");
    expect(audits[0]).toEqual(expect.objectContaining({ action: "CREATE", resource: "player" }));
  });

  it("denies create outside the assigned team scope", async () => {
    const mutable: PlayerRepository = { ...repository(), create: async () => playerA, update: async () => playerA, transitionStatus: async () => playerA };
    await expect(new PlayerService(mutable, { list: async () => [], getById: async () => ({ id: "team-a", contingentId: "contingent-a", category: "PUTRA", name: "Tim A", shortName: "A", manager: "Manager", headCoach: "Coach", groupId: "", status: "DRAFT", eligibility: "PENDING" }) }).create(
      { userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["player.create"], scopes: [{ scope: "TEAM", scopeId: "team-b" }] },
      { teamId: "team-a", name: "New Player", number: 7, position: "ANCHOR", birthDate: "2004-01-01", identityType: "NIK", identityNumber: "1234567890123456" },
    )).rejects.toThrow("RESOURCE_OUTSIDE_SCOPE");
  });

  it("rejects protected fields and validates transitions from database state", async () => {
    const mutable: PlayerRepository = { ...repository([playerA]), create: async () => playerA, update: async (_id: string, input: PlayerUpdateInput) => ({ ...playerA, ...input }), transitionStatus: async (_id, targetStatus) => ({ ...playerA, status: targetStatus }) };
    const service = new PlayerService(mutable, undefined, { append: async () => {} });
    const identity = { userId: "user-a", roles: ["TEAM_MANAGER"] as ("TEAM_MANAGER")[], permissions: ["player.update"] as ("player.update")[], scopes: [{ scope: "TEAM" as const, scopeId: "team-a" }] };
    await expect(service.update(identity, "player-a", { name: "Updated" })).resolves.toEqual(expect.objectContaining({ name: "Updated" }));
    await expect(service.transitionStatus(identity, "player-a", "VERIFIED")).rejects.toThrow("Invalid registration transition");
  });
});
