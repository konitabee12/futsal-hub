export type AuditAction =
  | "LOGIN"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SUBMIT"
  | "VERIFY"
  | "REJECT"
  | "APPROVE"
  | "ELIGIBILITY_CHANGE"
  | "MATCH_RESULT_CHANGE"
  | "SCHEDULE_CHANGE"
  | "STANDINGS_RECALCULATION";

export interface AuditRecord {
  actor: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditRepository {
  append(record: AuditRecord): Promise<void>;
}

export function createAuditRecord(
  input: Omit<AuditRecord, "timestamp"> & { timestamp?: string },
): AuditRecord {
  return {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
}