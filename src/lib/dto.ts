import type { Contingent, DocumentRecord, Official, Player, Team } from "@/types/domain";

export interface AdminPlayerListDto {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  number: number;
  position: Player["position"];
  birthYear: string;
  identityDisplay: string;
  status: Player["status"];
  eligibility: Player["eligibility"];
}

export interface AdminOfficialListDto {
  id: string;
  teamIds: string[];
  teamName: string;
  name: string;
  position: Official["position"];
  identityDisplay: string;
  phoneDisplay: string;
  status: Official["status"];
  eligibility: Official["eligibility"];
}

export interface AdminDocumentListDto {
  id: string;
  ownerType: DocumentRecord["ownerType"];
  ownerName: string;
  documentType: string;
  fileName: string;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  status: DocumentRecord["status"];
}

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

export interface AdminVerificationItemDto {
  label: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

export interface AdminVerificationDecisionDto {
  decision: "VERIFIED" | "NEEDS_CORRECTION" | "REJECTED" | "SUBMITTED";
  by: string;
  at: string;
  reason?: string;
  notes?: string;
}

export interface AdminVerificationCaseListDto {
  id: string;
  subjectType: "CONTINGENT" | "TEAM" | "PLAYER" | "OFFICIAL";
  subjectName: string;
  category: "PUTRA" | "PUTRI";
  contingentName: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_CORRECTION" | "VERIFIED" | "REJECTED";
  submittedAt: string;
  items: AdminVerificationItemDto[];
  decisions: AdminVerificationDecisionDto[];
}
