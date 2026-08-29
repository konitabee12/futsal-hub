import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminVerificationCaseListDto, AdminVerificationDecisionDto, AdminVerificationItemDto } from "@/lib/dto";
import type { Database } from "@/types/database";
import type { VerificationDecisionInput, VerificationRepository } from "@/repositories/contracts";

interface VerificationCaseRow {
  id: string;
  subject_type: "CONTINGENT" | "TEAM" | "PLAYER" | "OFFICIAL";
  subject_id: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_CORRECTION" | "VERIFIED" | "REJECTED";
  submitted_at: string;
  updated_at: string;
}

interface VerificationItemRow {
  id: string;
  case_id: string;
  label: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

interface VerificationDecisionRow {
  id: string;
  case_id: string;
  decision: "VERIFIED" | "NEEDS_CORRECTION" | "REJECTED" | "SUBMITTED";
  decided_by: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

interface PlayerForVerification {
  team_id: string;
  name: string;
  category: "PUTRA" | "PUTRI";
}

interface OfficialForVerification {
  name: string;
}

interface TeamForVerification {
  contingent_id: string;
  category: "PUTRA" | "PUTRI";
  name: string;
}

interface ContingentForVerification {
  name: string;
}

export class SupabaseVerificationRepository implements VerificationRepository {
  private readonly verificationCaseColumns =
    "id, subject_type, subject_id, status, submitted_at, updated_at";

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(): Promise<AdminVerificationCaseListDto[]> {
    const { data: cases, error: casesError } = await this.supabase
      .from("verification_cases")
      .select<string, VerificationCaseRow>(this.verificationCaseColumns);

    if (casesError) throw casesError;

    return Promise.all(
      (cases ?? []).map((vc) => this.enrichVerificationCase(vc))
    );
  }

  async getById(id: string): Promise<AdminVerificationCaseListDto | null> {
    const { data: vc, error: caseError } = await this.supabase
      .from("verification_cases")
      .select<string, VerificationCaseRow>(this.verificationCaseColumns)
      .eq("id", id)
      .single();

    if (caseError) {
      if (caseError.code === "PGRST116") return null;
      throw caseError;
    }

    return this.enrichVerificationCase(vc);
  }

  private async enrichVerificationCase(vc: VerificationCaseRow): Promise<AdminVerificationCaseListDto> {
    const [items, decisions, subjectName, contingentName, category] = await Promise.all([
      this.fetchItems(vc.id),
      this.fetchDecisions(vc.id),
      this.fetchSubjectName(vc.subject_type, vc.subject_id),
      this.fetchContingentName(vc.subject_type, vc.subject_id),
      this.fetchCategory(vc.subject_type, vc.subject_id),
    ]);

    return {
      id: vc.id,
      subjectType: vc.subject_type,
      subjectName,
      category: category ?? "PUTRA",
      contingentName,
      status: vc.status,
      submittedAt: vc.submitted_at,
      items,
      decisions,
    };
  }

  private async fetchItems(caseId: string): Promise<AdminVerificationItemDto[]> {
    const { data, error } = await this.supabase
      .from("verification_items")
      .select<string, VerificationItemRow>("id, case_id, label, status")
      .eq("case_id", caseId)
      .order("id");

    if (error) throw error;

    return (data ?? []).map((item) => ({
      label: item.label,
      status: item.status,
    }));
  }

  private async fetchDecisions(caseId: string): Promise<AdminVerificationDecisionDto[]> {
    const { data, error } = await this.supabase
      .from("verification_decisions")
      .select<string, VerificationDecisionRow>(
        "id, case_id, decision, decided_by, reason, notes, created_at"
      )
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const { data: users, error: usersError } = await this.supabase
      .from("users")
      .select<string, { id: string; display_name: string }>("id, display_name");

    if (usersError) throw usersError;

    const userMap = new Map((users ?? []).map((u) => [u.id, u.display_name]));

    return (data ?? []).map((decision) => ({
      decision: decision.decision,
      by: userMap.get(decision.decided_by) ?? decision.decided_by,
      at: new Date(decision.created_at).toLocaleString("id-ID"),
      ...(decision.reason ? { reason: decision.reason } : {}),
      ...(decision.notes ? { notes: decision.notes } : {}),
    }));
  }

  private async fetchSubjectName(
    subjectType: string,
    subjectId: string
  ): Promise<string> {
    if (subjectType === "PLAYER") {
      const { data } = await this.supabase
        .from("players")
        .select<string, { name: string }>("name")
        .eq("id", subjectId)
        .single();
      return data?.name ?? subjectId;
    }

    if (subjectType === "OFFICIAL") {
      const { data } = await this.supabase
        .from("officials")
        .select<string, OfficialForVerification>("name")
        .eq("id", subjectId)
        .single();
      return data?.name ?? subjectId;
    }

    if (subjectType === "TEAM") {
      const { data } = await this.supabase
        .from("teams")
        .select<string, { name: string }>("name")
        .eq("id", subjectId)
        .single();
      return data?.name ?? subjectId;
    }

    if (subjectType === "CONTINGENT") {
      const { data } = await this.supabase
        .from("contingents")
        .select<string, { name: string }>("name")
        .eq("id", subjectId)
        .single();
      return data?.name ?? subjectId;
    }

    return subjectId;
  }

  private async fetchContingentName(
    subjectType: string,
    subjectId: string
  ): Promise<string> {
    if (subjectType === "CONTINGENT") {
      const { data } = await this.supabase
        .from("contingents")
        .select<string, { name: string }>("name")
        .eq("id", subjectId)
        .single();
      return data?.name ?? "";
    }

    if (subjectType === "TEAM") {
      const { data } = await this.supabase
        .from("teams")
        .select<string, { contingent_id: string }>("contingent_id")
        .eq("id", subjectId)
        .single();

      if (data?.contingent_id) {
        const { data: contingent } = await this.supabase
          .from("contingents")
          .select<string, { name: string }>("name")
          .eq("id", data.contingent_id)
          .single();
        return contingent?.name ?? "";
      }
      return "";
    }

    if (subjectType === "PLAYER") {
      const { data } = await this.supabase
        .from("players")
        .select<string, { team_id: string }>("team_id")
        .eq("id", subjectId)
        .single();

      if (data?.team_id) {
        const { data: team } = await this.supabase
          .from("teams")
          .select<string, { contingent_id: string }>("contingent_id")
          .eq("id", data.team_id)
          .single();

        if (team?.contingent_id) {
          const { data: contingent } = await this.supabase
            .from("contingents")
            .select<string, { name: string }>("name")
            .eq("id", team.contingent_id)
            .single();
          return contingent?.name ?? "";
        }
      }
      return "";
    }

    if (subjectType === "OFFICIAL") {
      const { data } = await this.supabase
        .from("team_members")
        .select<string, { team_id: string }>("team_id")
        .eq("official_id", subjectId)
        .single();

      if (data?.team_id) {
        const { data: team } = await this.supabase
          .from("teams")
          .select<string, { contingent_id: string }>("contingent_id")
          .eq("id", data.team_id)
          .single();

        if (team?.contingent_id) {
          const { data: contingent } = await this.supabase
            .from("contingents")
            .select<string, { name: string }>("name")
            .eq("id", team.contingent_id)
            .single();
          return contingent?.name ?? "";
        }
      }
      return "";
    }

    return "";
  }

  private async fetchCategory(
    subjectType: string,
    subjectId: string
  ): Promise<"PUTRA" | "PUTRI" | null> {
    if (subjectType === "TEAM") {
      const { data } = await this.supabase
        .from("teams")
        .select<string, { category: "PUTRA" | "PUTRI" }>("category")
        .eq("id", subjectId)
        .single();
      return data?.category ?? null;
    }

    if (subjectType === "PLAYER") {
      const { data } = await this.supabase
        .from("players")
        .select<string, { team_id: string }>("team_id")
        .eq("id", subjectId)
        .single();

      if (data?.team_id) {
        const { data: team } = await this.supabase
          .from("teams")
          .select<string, { category: "PUTRA" | "PUTRI" }>("category")
          .eq("id", data.team_id)
          .single();
        return team?.category ?? null;
      }
      return null;
    }

    if (subjectType === "OFFICIAL") {
      const { data } = await this.supabase
        .from("team_members")
        .select<string, { team_id: string }>("team_id")
        .eq("official_id", subjectId)
        .single();

      if (data?.team_id) {
        const { data: team } = await this.supabase
          .from("teams")
          .select<string, { category: "PUTRA" | "PUTRI" }>("category")
          .eq("id", data.team_id)
          .single();
        return team?.category ?? null;
      }
      return null;
    }

    return null;
  }

  async applyDecision(
    input: { caseId: string; targetDecision: "VERIFIED" | "NEEDS_CORRECTION" | "REJECTED"; reason?: string; notes?: string },
    decidedBy: string,
  ): Promise<AdminVerificationCaseListDto> {
    // 1. Update case status
    const { error: updateError } = await this.supabase
      .from("verification_cases")
      .update({ status: input.targetDecision, updated_at: new Date().toISOString() })
      .eq("id", input.caseId);

    if (updateError) throw updateError;

    // 2. Insert decision record
    const { error: decisionError } = await this.supabase
      .from("verification_decisions")
      .insert({
        case_id: input.caseId,
        decision: input.targetDecision,
        decided_by: decidedBy,
        reason: input.reason || null,
        notes: input.notes || null,
      });

    if (decisionError) throw decisionError;

    // 3. Return updated case
    const updated = await this.getById(input.caseId);
    if (!updated) throw new Error("Failed to retrieve updated case");
    return updated;
  }
}
