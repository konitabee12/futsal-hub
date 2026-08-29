import { assertAuthorized, authorize, type AuthenticatedIdentity } from "@/lib/authorization";
import type { AdminDocumentListDto } from "@/lib/dto";
import type { DocumentReadRecord, DocumentReadRepository } from "@/repositories/contracts";

function toAdminDto({ teamIds: _teamIds, contingentIds: _contingentIds, ...document }: DocumentReadRecord): AdminDocumentListDto { return document; }
function mayView(identity: AuthenticatedIdentity, document: DocumentReadRecord): boolean {
  if (document.teamIds.some((teamId, index) => authorize(identity, "document.view", { scope: "TEAM", teamId, ...(document.contingentIds[index] ? { contingentId: document.contingentIds[index] } : {}) }).allowed)) return true;
  return document.teamIds.length === 0 && document.contingentIds.some((contingentId) => authorize(identity, "document.view", { scope: "CONTINGENT", contingentId }).allowed);
}

export class DocumentService {
  constructor(private readonly repository: DocumentReadRepository) {}
  async list(identity: AuthenticatedIdentity): Promise<AdminDocumentListDto[]> {
    assertAuthorized(identity, "document.view");
    return (await this.repository.list()).filter((document) => mayView(identity, document)).map(toAdminDto);
  }
}
