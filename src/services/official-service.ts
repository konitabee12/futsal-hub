import { assertAuthorized, authorize, type AuthenticatedIdentity } from "@/lib/authorization";
import type { AdminOfficialListDto } from "@/lib/dto";
import type { OfficialReadRecord, OfficialReadRepository } from "@/repositories/contracts";

function toAdminDto({ contingentIds: _contingentIds, ...official }: OfficialReadRecord): AdminOfficialListDto { return official; }

function mayView(identity: AuthenticatedIdentity, official: OfficialReadRecord): boolean {
  return official.teamIds.some((teamId, index) => {
    const contingentId = official.contingentIds[index];
    return authorize(identity, "official.view", {
      scope: "TEAM", teamId,
      ...(contingentId ? { contingentId } : {}),
    }).allowed;
  });
}

export class OfficialService {
  constructor(private readonly repository: OfficialReadRepository) {}

  async list(identity: AuthenticatedIdentity): Promise<AdminOfficialListDto[]> {
    assertAuthorized(identity, "official.view");
    const officials = await this.repository.list();
    return officials.filter((official) => mayView(identity, official)).map(toAdminDto);
  }
}
