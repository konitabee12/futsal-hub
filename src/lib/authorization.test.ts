import { describe, expect, it } from "bun:test";
import { authorize } from "@/lib/authorization";

const contingentAdmin = {
  userId: "user-a",
  roles: ["CONTINGENT_ADMIN"] as const,
  permissions: ["team.update"] as const,
  scopes: [{ scope: "CONTINGENT" as const, scopeId: "contingent-a" }],
};

describe("authorize", () => {
  it("denies an identity without permission", () => {
    expect(authorize({ userId: "user-a", roles: [], permissions: [], scopes: [] }, "team.update").allowed).toBe(false);
  });

  it("denies a permission outside the assigned scope", () => {
    expect(authorize(contingentAdmin, "team.update", {
      scope: "TEAM",
      teamId: "team-b",
      contingentId: "contingent-b",
    })).toEqual({ allowed: false, reason: "RESOURCE_OUTSIDE_SCOPE" });
  });

  it("allows a permission within the assigned contingent scope", () => {
    expect(authorize(contingentAdmin, "team.update", {
      scope: "TEAM",
      teamId: "team-a",
      contingentId: "contingent-a",
    }).allowed).toBe(true);
  });

  it("does not grant FUTSAL_ADMIN audit access implicitly", () => {
    expect(authorize({ userId: "user-a", roles: ["FUTSAL_ADMIN"], permissions: [], scopes: [] }, "audit.view").allowed).toBe(false);
  });
});