import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { DocumentReadRecord, DocumentReadRepository } from "@/repositories/contracts";

type DocumentRow = Pick<Database["public"]["Tables"]["documents"]["Row"], "id" | "owner_type" | "owner_id" | "document_type" | "version" | "status" | "created_at">;
const documentColumns = "id, owner_type, owner_id, document_type, version, status, created_at";

export class SupabaseDocumentRepository implements DocumentReadRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(): Promise<DocumentReadRecord[]> {
    const { data, error } = await this.supabase.from("documents").select(documentColumns).order("created_at", { ascending: false });
    if (error) throw new Error("Unable to load documents");
    return this.mapRows(data);
  }

  private async mapRows(rows: DocumentRow[]): Promise<DocumentReadRecord[]> {
    if (!rows.length) return [];
    const ids = (type: string) => rows.filter((row) => row.owner_type === type).map((row) => row.owner_id);
    const [contingentResult, teamResult, playerResult, officialResult, membershipResult] = await Promise.all([
      this.supabase.from("contingents").select("id, name").in("id", ids("CONTINGENT")),
      this.supabase.from("teams").select("id, contingent_id, name").in("id", ids("TEAM")),
      this.supabase.from("players").select("id, team_id, name").in("id", ids("PLAYER")),
      this.supabase.from("officials").select("id, name").in("id", ids("OFFICIAL")),
      this.supabase.from("team_members").select("official_id, team_id").in("official_id", ids("OFFICIAL")),
    ]);
    if (contingentResult.error || teamResult.error || playerResult.error || officialResult.error || membershipResult.error) throw new Error("Unable to load document relationships");
    const playerTeamIds = playerResult.data.map((player) => player.team_id);
    const officialTeamIds = membershipResult.data.flatMap((member) => member.official_id ? [member.team_id] : []);
    const allTeamIds = [...new Set([...teamResult.data.map((team) => team.id), ...playerTeamIds, ...officialTeamIds])];
    const { data: relatedTeams, error: relatedTeamError } = allTeamIds.length
      ? await this.supabase.from("teams").select("id, contingent_id, name").in("id", allTeamIds)
      : { data: [], error: null };
    if (relatedTeamError) throw new Error("Unable to load document parent teams");
    const contingents = new Map(contingentResult.data.map((item) => [item.id, item]));
    const teams = new Map(relatedTeams.map((item) => [item.id, item]));
    const players = new Map(playerResult.data.map((item) => [item.id, item]));
    const officials = new Map(officialResult.data.map((item) => [item.id, item]));
    const officialTeams = new Map<string, string[]>();
    for (const membership of membershipResult.data) {
      if (!membership.official_id || !teams.has(membership.team_id)) continue;
      const entries = officialTeams.get(membership.official_id) ?? [];
      entries.push(membership.team_id);
      officialTeams.set(membership.official_id, entries);
    }
    return rows.flatMap((row) => {
      const parent = this.parentFor(row, contingents, teams, players, officials, officialTeams);
      if (!parent) return [];
      return [{
        id: row.id, ownerType: row.owner_type as DocumentReadRecord["ownerType"], ownerName: parent.ownerName,
        documentType: row.document_type, fileName: "â€”", version: row.version, uploadedAt: row.created_at,
        uploadedBy: "â€”", status: row.status as DocumentReadRecord["status"], teamIds: parent.teamIds, contingentIds: parent.contingentIds,
      }];
    });
  }

  private parentFor(
    row: DocumentRow,
    contingents: Map<string, { id: string; name: string }>,
    teams: Map<string, { id: string; contingent_id: string; name: string }>,
    players: Map<string, { id: string; team_id: string; name: string }>,
    officials: Map<string, { id: string; name: string }>,
    officialTeams: Map<string, string[]>,
  ): { ownerName: string; teamIds: string[]; contingentIds: string[] } | null {
    if (row.owner_type === "CONTINGENT") {
      const contingent = contingents.get(row.owner_id);
      return contingent ? { ownerName: contingent.name, teamIds: [], contingentIds: [contingent.id] } : null;
    }
    if (row.owner_type === "TEAM") return this.teamParent(teams.get(row.owner_id));
    if (row.owner_type === "PLAYER") {
      const player = players.get(row.owner_id); if (!player) return null;
      const parent = this.teamParent(teams.get(player.team_id)); return parent ? { ...parent, ownerName: player.name } : null;
    }
    if (row.owner_type === "OFFICIAL") {
      const official = officials.get(row.owner_id); const teamIds = officialTeams.get(row.owner_id) ?? [];
      const relatedTeams = teamIds.flatMap((id) => { const team = teams.get(id); return team ? [team] : []; });
      return official && relatedTeams.length ? { ownerName: official.name, teamIds: relatedTeams.map((team) => team.id), contingentIds: [...new Set(relatedTeams.map((team) => team.contingent_id))] } : null;
    }
    return null;
  }

  private teamParent(team: { id: string; contingent_id: string; name: string } | undefined) {
    return team ? { ownerName: team.name, teamIds: [team.id], contingentIds: [team.contingent_id] } : null;
  }
}
