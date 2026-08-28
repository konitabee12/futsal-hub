import { describe, expect, it } from "bun:test";
import { ContingentService } from "@/services/contingent-service";
import type { AuditRecord, AuditRepository } from "@/lib/audit";
import type { Contingent } from "@/types/domain";
import type { ContingentRepository } from "@/repositories/contracts";

function createRepository(initial: Contingent): ContingentRepository {
  let current = initial;
  return {
    list: async () => [current],
    getById: async () => current,
    create: async (input) => ({ ...current, ...input, id: "new-contingent", status: "DRAFT" }),
    update: async (_id, input) => { current = { ...current, ...input }; return current; },
    transitionStatus: async (_id, status) => { current = { ...current, status }; return current; },
    delete: async () => undefined,
  };
}

function createAuditRepository(records: AuditRecord[]): AuditRepository {
  return { append: async (record) => { records.push(record); } };
}

const identity = {
  userId: "user-a",
  roles: ["CONTINGENT_ADMIN"] as const,
  permissions: ["contingent.update"] as const,
  contingentIds: ["contingent-a"],
};

const contingent: Contingent = {
  id: "contingent-a",
  eventId: "event-a",
  sportId: "sport-a",
  code: "AAA",
  name: "Kontingen A",
  region: "Makassar",
  pic: "PIC A",
  email: "pic@example.test",
  phone: "0800000000",
  status: "DRAFT",
  documents: 0,
  verifiedDocuments: 0,
};

describe("ContingentService", () => {
  it("denies update outside the actor scope", async () => {
    const service = new ContingentService(createRepository({ ...contingent, id: "contingent-b" }), createAuditRepository([]));
    await expect(service.update(identity, "contingent-b", { name: "Other" })).rejects.toThrow("RESOURCE_OUTSIDE_SCOPE");
  });

  it("rejects an illegal status transition", async () => {
    const service = new ContingentService(createRepository(contingent), createAuditRepository([]));
    await expect(service.transitionStatus(identity, contingent.id, "ACTIVE")).rejects.toThrow("Invalid registration transition");
  });

  it("records an audit for an allowed update", async () => {
    const records: AuditRecord[] = [];
    const service = new ContingentService(createRepository(contingent), createAuditRepository(records));
    await service.update(identity, contingent.id, { name: "Kontingen Baru" });
    expect(records).toHaveLength(1);
    expect(records[0]?.action).toBe("UPDATE");
  });
});