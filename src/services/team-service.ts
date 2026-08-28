import { assertAuthorized, type AuthenticatedIdentity } from "@/lib/authorization";
import type { Team } from "@/types/domain";
import type { TeamReadRepository } from "@/repositories/contracts";

export class TeamService {
  constructor(private readonly repository: TeamReadRepository) {}

  async list(identity: AuthenticatedIdentity): Promise<Team[]> {
    assertAuthorized(identity, "team.view");
    return this.repository.list();
  }

  async getById(identity: AuthenticatedIdentity, id: string): Promise<Team | null> {
    assertAuthorized(identity, "team.view");
    const team = await this.repository.getById(id);
    if (!team) return null;
    assertAuthorized(identity, "team.view", {
      scope: "TEAM",
      teamId: team.id,
      contingentId: team.contingentId,
    });
    return team;
  }
}