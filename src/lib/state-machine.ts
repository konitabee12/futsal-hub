import type {
  DocumentStatus,
  EligibilityStatus,
  MatchStatus,
  RegistrationStatus,
  ResultStatus,
} from "@/types/domain";

export type WorkflowStatus =
  | RegistrationStatus
  | DocumentStatus
  | EligibilityStatus
  | MatchStatus
  | ResultStatus;

export type WorkflowName =
  | "registration"
  | "document"
  | "verification"
  | "eligibility"
  | "match"
  | "result";

const TRANSITIONS: Record<WorkflowName, Record<string, readonly string[]>> = {
  registration: {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["NEEDS_CORRECTION", "VERIFIED", "REJECTED"],
    NEEDS_CORRECTION: ["SUBMITTED"],
    VERIFIED: ["ACTIVE", "INACTIVE"],
    ACTIVE: ["INACTIVE"],
    INACTIVE: ["ACTIVE"],
  },
  document: {
    PENDING: ["VERIFIED", "REJECTED"],
    REJECTED: ["PENDING"],
  },
  verification: {
    SUBMITTED: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["NEEDS_CORRECTION", "VERIFIED", "REJECTED"],
    NEEDS_CORRECTION: ["SUBMITTED"],
  },
  eligibility: {
    PENDING: ["ELIGIBLE", "NOT_ELIGIBLE"],
    NOT_ELIGIBLE: ["PENDING"],
  },
  match: {
    SCHEDULED: ["CHECK_IN", "POSTPONED", "CANCELLED"],
    CHECK_IN: ["LIVE", "CANCELLED"],
    LIVE: ["HALFTIME", "FINISHED", "CANCELLED"],
    HALFTIME: ["LIVE", "FINISHED", "CANCELLED"],
    FINISHED: ["VOID"],
    POSTPONED: ["SCHEDULED", "CANCELLED"],
  },
  result: {
    PENDING: ["SUBMITTED"],
    SUBMITTED: ["VERIFIED"],
    VERIFIED: ["PUBLISHED"],
  },
};

export function canTransition(
  workflow: WorkflowName,
  currentStatus: WorkflowStatus,
  nextStatus: WorkflowStatus,
): boolean {
  return TRANSITIONS[workflow][currentStatus]?.includes(nextStatus) === true;
}

export function validateTransition(
  workflow: WorkflowName,
  currentStatus: WorkflowStatus,
  nextStatus: WorkflowStatus,
): void {
  if (!canTransition(workflow, currentStatus, nextStatus)) {
    throw new Error(`Invalid ${workflow} transition: ${currentStatus} -> ${nextStatus}`);
  }
}

export function eligibleForLineup(status: EligibilityStatus): boolean {
  return status === "ELIGIBLE";
}

export function validForStandings(status: ResultStatus): boolean {
  return status === "VERIFIED" || status === "PUBLISHED";
}