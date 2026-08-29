import { describe, expect, it } from "bun:test";
import { DocumentService } from "@/services/document-service";
import type { DocumentReadRecord, DocumentReadRepository } from "@/repositories/contracts";

const teamDocument: DocumentReadRecord = {
  id: "document-team", ownerType: "TEAM", ownerName: "Tim A", documentType: "Surat Mandat", fileName: "â€”", version: 1,
  uploadedAt: "2026-08-01T00:00:00.000Z", uploadedBy: "â€”", status: "PENDING", teamIds: ["team-a"], contingentIds: ["contingent-a"],
};
const playerDocument: DocumentReadRecord = { ...teamDocument, id: "document-player", ownerType: "PLAYER", ownerName: "Pemain A" };
const contingentDocument: DocumentReadRecord = { ...teamDocument, id: "document-contingent", ownerType: "CONTINGENT", ownerName: "Kontingen A", teamIds: [], contingentIds: ["contingent-a"] };
const outsideDocument: DocumentReadRecord = { ...teamDocument, id: "document-outside", ownerName: "Tim B", teamIds: ["team-b"], contingentIds: ["contingent-b"] };
function repository(documents: DocumentReadRecord[]): DocumentReadRepository { return { list: async () => documents }; }

describe("DocumentService", () => {
  it("denies an authenticated identity without document.view", async () => {
    await expect(new DocumentService(repository([teamDocument])).list({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: [], scopes: [] })).rejects.toThrow("MISSING_PERMISSION");
  });

  it("omits documents outside the assigned team scope", async () => {
    const documents = await new DocumentService(repository([teamDocument, outsideDocument])).list({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["document.view"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] });
    expect(documents).toEqual([expect.objectContaining({ id: "document-team" })]);
  });

  it("allows team-owned player documents through the valid parent team", async () => {
    const documents = await new DocumentService(repository([playerDocument])).list({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["document.view"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] });
    expect(documents).toHaveLength(1);
  });

  it("allows contingent ancestor scope and direct contingent documents", async () => {
    const documents = await new DocumentService(repository([teamDocument, contingentDocument])).list({ userId: "user-a", roles: ["CONTINGENT_ADMIN"], permissions: ["document.view"], scopes: [{ scope: "CONTINGENT", scopeId: "contingent-a" }] });
    expect(documents).toHaveLength(2);
  });

  it("returns only the privacy-safe DTO", async () => {
    const document = (await new DocumentService(repository([teamDocument])).list({ userId: "user-a", roles: ["TEAM_MANAGER"], permissions: ["document.view"], scopes: [{ scope: "TEAM", scopeId: "team-a" }] }))[0];
    expect(document).toEqual(expect.objectContaining({ fileName: "â€”", uploadedBy: "â€”" }));
    expect(document).not.toHaveProperty("fileReference");
    expect(document).not.toHaveProperty("teamIds");
    expect(document).not.toHaveProperty("contingentIds");
  });
});
