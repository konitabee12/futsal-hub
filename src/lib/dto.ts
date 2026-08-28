import type { Contingent, Player, Team } from "@/types/domain";

export type PlayerPublicDto = Pick<Player, "id" | "teamId" | "name" | "number" | "position" | "eligibility">;
export type TeamPublicDto = Pick<Team, "id" | "category" | "name" | "shortName" | "headCoach" | "groupId" | "eligibility">;
export type ContingentPublicDto = Pick<Contingent, "id" | "code" | "name" | "region" | "status">;

export function toPublicPlayer(player: Player): PlayerPublicDto {
  return {
    id: player.id,
    teamId: player.teamId,
    name: player.name,
    number: player.number,
    position: player.position,
    eligibility: player.eligibility,
  };
}

export function toPublicTeam(team: Team): TeamPublicDto {
  return {
    id: team.id,
    category: team.category,
    name: team.name,
    shortName: team.shortName,
    headCoach: team.headCoach,
    groupId: team.groupId,
    eligibility: team.eligibility,
  };
}

export function toPublicContingent(contingent: Contingent): ContingentPublicDto {
  return {
    id: contingent.id,
    code: contingent.code,
    name: contingent.name,
    region: contingent.region,
    status: contingent.status,
  };
}