import type { Contingent, Player, Team } from "@/types/domain";
import type { AdminDocumentListDto, AdminOfficialListDto, AdminPlayerListDto, AdminVerificationCaseListDto } from "@/lib/dto";

export interface ContingentCreateInput {
  eventId: string;
  sportId: string;
  code: string;
  name: string;
  region: string;
  pic: string;
  email: string;
  phone: string;
  logoPath?: string;
}

export interface ContingentUpdateInput {
  name?: string;
  region?: string;
  pic?: string;
  email?: string;
  phone?: string;
  logoPath?: string;
}

export interface ContingentStatusTransitionInput {
  targetStatus: Contingent["status"];
}

export interface Repository<T, CreateInput, UpdateInput> {
  list(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(input: CreateInput): Promise<T>;
  update(id: string, input: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface ContingentReadRepository {
  list(): Promise<Contingent[]>;
  getById(id: string): Promise<Contingent | null>;
}

export interface TeamReadRepository {
  list(): Promise<Team[]>;
  getById(id: string): Promise<Team | null>;
}

export interface PlayerReadRecord extends AdminPlayerListDto {
  contingentId: string;
}

export interface PlayerReadRepository {
  list(): Promise<PlayerReadRecord[]>;
  getById(id: string): Promise<PlayerReadRecord | null>;
}

export interface OfficialReadRecord extends AdminOfficialListDto {
  contingentIds: string[];
}

export interface OfficialReadRepository {
  list(): Promise<OfficialReadRecord[]>;
}

export interface DocumentReadRecord extends AdminDocumentListDto {
  teamIds: string[];
  contingentIds: string[];
}

export interface DocumentReadRepository {
  list(): Promise<DocumentReadRecord[]>;
}

export interface VerificationReadRepository {
  list(): Promise<AdminVerificationCaseListDto[]>;
  getById(id: string): Promise<AdminVerificationCaseListDto | null>;
}

export interface VerificationDecisionInput {
  caseId: string;
  targetDecision: "VERIFIED" | "NEEDS_CORRECTION" | "REJECTED";
  reason?: string;
  notes?: string;
}

export interface VerificationRepository extends VerificationReadRepository {
  applyDecision(input: VerificationDecisionInput, decidedBy: string): Promise<AdminVerificationCaseListDto>;
}

export interface EligibilityRepository {
  listPlayersWithEligibility(): Promise<AdminPlayerListDto[]>;
  getPlayerById(id: string): Promise<AdminPlayerListDto | null>;
  updatePlayerEligibility(playerId: string, targetStatus: "ELIGIBLE" | "NOT_ELIGIBLE", reason?: string, notes?: string): Promise<AdminPlayerListDto>;
}

export interface PlayerCreateInput {
  teamId: string;
  name: string;
  number: number;
  position: Player["position"];
  birthDate: string;
  identityType: "NIK" | "PASSPORT";
  identityNumber: string;
}

export interface PlayerUpdateInput {
  name?: string;
  number?: number;
  position?: Player["position"];
}

export interface PlayerRepository extends PlayerReadRepository {
  create(input: PlayerCreateInput): Promise<PlayerReadRecord>;
  update(id: string, input: PlayerUpdateInput): Promise<PlayerReadRecord>;
  transitionStatus(id: string, targetStatus: Player["status"]): Promise<PlayerReadRecord>;
}

export interface TeamCreateInput {
  contingentId: string;
  category: Team["category"];
  name: string;
  shortName: string;
  manager: string;
  headCoach: string;
}

export interface TeamUpdateInput {
  name?: string;
  shortName?: string;
  manager?: string;
  headCoach?: string;
}

export type ContingentRepository = Repository<Contingent, ContingentCreateInput, ContingentUpdateInput> & {
  transitionStatus(id: string, targetStatus: Contingent["status"]): Promise<Contingent>;
};
export type TeamRepository = TeamReadRepository & {
  create(input: TeamCreateInput): Promise<Team>;
  update(id: string, input: TeamUpdateInput): Promise<Team>;
  transitionStatus(id: string, targetStatus: Team["status"]): Promise<Team>;
  delete(id: string): Promise<void>;
};
