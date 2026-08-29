import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { OfficialReadRecord, OfficialReadRepository } from "@/repositories/contracts";

type OfficialRow = Pick<Database["public"]["Tables"]["officials"]["Row"], "id" | "name" | "position" | "status" | "eligibility">;

const officialColumns = "id, name, position, status, eligibility";

export class SupabaseOfficialRepository implements OfficialReadRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(): Promise<OfficialReadRecord[]> {
    const { data: officials, error } = await this.supabase.from("officials").select(officialColumns).order("name");
    if (error) throw new Error("Unable to load officials");
    return this.mapRows(officials);
  }

  private async mapRows(rows: OfficialRow[]): Promise<OfficialReadRecord[]> {
    if (!rows.length) return [];
    const officialIds = rows.map((row) => row.id);
    const { data: memberships, error: membershipError } = await this.supabase
      .from("team_members")
      .select("official_id, team_id")
      .in("official_id", officialIds);
    if (membershipError) throw new Error("Unable to load official relationships");
    const teamIds = [...new Set(memberships.flatMap((membership) => membership.official_id ? [membership.team_id] : []))];
    if (!teamIds.length) return [];
    const { data: teams, error: teamError } = await this.supabase
      .from("teams")
      .select("id, contingent_id, name")
      .in("id", teamIds);
    if (teamError) throw new Error("Unable to load official teams");
    const teamsById = new Map(teams.map((team) => [team.id, team]));
    const teamsByOfficial = new Map<string, typeof teams>();
    for (const membership of memberships) {
      if (!membership.official_id) continue;
      const team = teamsById.get(membership.team_id);
      if (!team) continue;
      const entries = teamsByOfficial.get(membership.official_id) ?? [];
      entries.push(team);
      teamsByOfficial.set(membership.official_id, entries);
    }
    return rows.flatMap((row) => {
      const relatedTeams = teamsByOfficial.get(row.id) ?? [];
      if (!relatedTeams.length) return [];
      return [{
        id: row.id,
        teamIds: relatedTeams.map((team) => team.id),
        contingentIds: [...new Set(relatedTeams.map((team) => team.contingent_id))],
        teamName: relatedTeams.map((team) => team.name).join(", "),
        name: row.name,
        position: row.position as OfficialReadRecord["position"],
        identityDisplay: "â€¢â€¢â€¢â€¢",
        phoneDisplay: "â€”",
        status: row.status as OfficialReadRecord["status"],
        eligibility: row.eligibility as OfficialReadRecord["eligibility"],
      }];
    });
  }
}
