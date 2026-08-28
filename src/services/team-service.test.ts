import { describe, expect, it } from "bun:test";
import { TeamService } from "@/services/team-service";
import type { Team } from "@/types/domain";
import type { TeamReadRepository } from "@/repositories/contracts";

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

function repository(team: Team = teamA): TeamReadRepository {
  return {
    list: async () => [team],
    getById: async (id) => id === team.id ? team : null,
  };
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
});