import { describe, expect, it } from "bun:test";
import { OfficialService } from "@/services/official-service";
import type { OfficialReadRecord, OfficialReadRepository } from "@/repositories/contracts";

const officialA: OfficialReadRecord = {
  id: "official-a", teamIds: ["team-a"], contingentIds: ["contingent-a"], teamName: "Tim A",
  name: "Official A", position: "HEAD_COACH", identityDisplay: "â€¢â€¢â€¢â€¢", phoneDisplay: "â€”", status: "DRAFT", eligibility: "PENDING",
};
const officialB: OfficialReadRecord = { ...officialA, id: "official-b", teamIds: ["team-b"], contingentIds: ["contingent-b"], teamName: "Tim B", name: "Official B" };
function repository(officials: OfficialReadRecord[] = [officialA, officialB]): OfficialReadRepository { return { list: async () => officials }; }

describe("OfficialService", () => {
  it("denies an authenticated identity without official.view", async () => {
    await expect(new OfficialService(repository()).list({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: [], scopes: [] })).rejects.toThrow("MISSING_PERMISSION");
  });

  it("omits officials outside the assigned team scope", async () => {
    const officials = await new OfficialService(repository()).list({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["official.view"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] });
    expect(officials).toEqual([expect.objectContaining({ id: "official-a" })]);
  });

  it("allows the containing contingent scope", async () => {
    const officials = await new OfficialService(repository()).list({ userId: "user-a", roles: ["CONTINGENT_ADMIN"], permissions: ["official.view"], scopes: [{ scope: "CONTINGENT", scopeId: "contingent-a" }] });
    expect(officials).toHaveLength(1);
    expect(officials[0]?.teamName).toBe("Tim A");
  });

  it("returns only the safe admin DTO", async () => {
    const official = (await new OfficialService(repository([officialA])).list({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["official.view"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] }))[0];
    expect(official).toEqual(expect.objectContaining({ identityDisplay: "â€¢â€¢â€¢â€¢", phoneDisplay: "â€”" }));
    expect(official).not.toHaveProperty("contingentIds");
    expect(official).not.toHaveProperty("identityNumber");
    expect(official).not.toHaveProperty("phone");
  });
});
