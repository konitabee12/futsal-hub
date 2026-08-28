export type Category = "PUTRA" | "PUTRI";

export type RegistrationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_CORRECTION"
  | "VERIFIED"
  | "REJECTED"
  | "ACTIVE"
  | "INACTIVE";

export type EligibilityStatus = "ELIGIBLE" | "NOT_ELIGIBLE" | "PENDING";

export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type MatchStatus =
  | "SCHEDULED"
  | "CHECK_IN"
  | "LIVE"
  | "HALFTIME"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED"
  | "VOID";

export type ResultStatus = "PENDING" | "SUBMITTED" | "VERIFIED" | "PUBLISHED";

export type MatchEventType =
  | "GOAL"
  | "OWN_GOAL"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "FOUL"
  | "SUBSTITUTION"
  | "TIMEOUT"
  | "PENALTY";

export type OfficialPosition =
  | "TEAM_MANAGER"
  | "HEAD_COACH"
  | "ASSISTANT_COACH"
  | "TEAM_DOCTOR"
  | "PHYSIO"
  | "KIT_MANAGER"
  | "OTHER";

export type Role =
  | "SUPER_ADMIN"
  | "EVENT_ADMIN"
  | "FUTSAL_ADMIN"
  | "VERIFIER"
  | "COMPETITION_OPERATOR"
  | "MATCH_OPERATOR"
  | "MATCH_OFFICIAL"
  | "CONTINGENT_ADMIN"
  | "TEAM_MANAGER";

export interface Contingent {
  id: string;
  code: string;
  name: string;
  region: string;
  pic: string;
  email: string;
  phone: string;
  status: RegistrationStatus;
  documents: number;
  verifiedDocuments: number;
}

export interface Team {
  id: string;
  contingentId: string;
  category: Category;
  name: string;
  shortName: string;
  manager: string;
  headCoach: string;
  groupId: string;
  status: RegistrationStatus;
  eligibility: EligibilityStatus;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  position: "PENJAGA GAWANG" | "ANCHOR" | "FLANK" | "PIVOT";
  birthDate: string;
  identityType: "NIK" | "PASSPORT";
  identityNumber: string;
  address: string;
  phone: string;
  email: string;
  status: RegistrationStatus;
  eligibility: EligibilityStatus;
}

export interface Official {
  id: string;
  teamId: string;
  name: string;
  position: OfficialPosition;
  identityNumber: string;
  phone: string;
  status: RegistrationStatus;
  eligibility: EligibilityStatus;
}

export interface DocumentRecord {
  id: string;
  ownerType: "CONTINGENT" | "TEAM" | "PLAYER" | "OFFICIAL";
  ownerId: string;
  ownerName: string;
  documentType: string;
  fileName: string;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentStatus;
}

export interface VerificationCase {
  id: string;
  subjectType: "CONTINGENT" | "TEAM" | "PLAYER" | "OFFICIAL";
  subjectId: string;
  subjectName: string;
  category: Category;
  contingentName: string;
  status: RegistrationStatus;
  submittedAt: string;
  items: { label: string; status: DocumentStatus }[];
  decisions: {
    decision: "VERIFIED" | "NEEDS_CORRECTION" | "REJECTED" | "SUBMITTED";
    by: string;
    at: string;
    reason?: string;
    notes?: string;
  }[];
}

export interface Group {
  id: string;
  category: Category;
  name: string;
  stage: "GROUP_STAGE" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL";
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  courts: number;
}

export interface MatchEvent {
  id: string;
  minute: string;
  type: MatchEventType;
  teamId: string;
  playerName: string;
  detail?: string;
}

export interface Match {
  id: string;
  category: Category;
  stage: Group["stage"];
  groupId: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId: string;
  date: string;
  kickoff: string;
  referee: string;
  status: MatchStatus;
  resultStatus: ResultStatus;
  homeScore: number | null;
  awayScore: number | null;
  events: MatchEvent[];
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  summary: string;
  body: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  at: string;
  ip: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  at: string;
  read: boolean;
}

export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
