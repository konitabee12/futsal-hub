import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Team } from "@/types/domain";
import type { TeamCreateInput, TeamRepository, TeamUpdateInput } from "@/repositories/contracts";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

const teamColumns = "id, contingent_id, category, name, short_name, manager, head_coach, status, eligibility";

function mapTeam(
  row: TeamRow,
  contingentName: string | undefined,
  groupName: string | undefined,
  playerCount: number,
): Team {
  const team: Team = {
    id: row.id,
    contingentId: row.contingent_id,
    category: row.category as Team["category"],
    name: row.name,
    shortName: row.short_name,
    manager: row.manager,
    headCoach: row.head_coach,
    groupId: "",
    status: row.status as Team["status"],
    eligibility: row.eligibility as Team["eligibility"],
    playerCount,
  };
  if (contingentName !== undefined) team.contingentName = contingentName;
  if (groupName !== undefined) team.groupName = groupName;
  return team;
}

export class SupabaseTeamRepository implements TeamRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(): Promise<Team[]> {
    const { data, error } = await this.supabase
      .from("teams")
      .select(teamColumns)
      .order("name");
    if (error) throw new Error("Unable to load teams");
    return this.mapRows(data);
  }

  async getById(id: string): Promise<Team | null> {
    const { data, error } = await this.supabase
      .from("teams")
      .select(teamColumns)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error("Unable to load team");
    if (!data) return null;
    const teams = await this.mapRows([data]);
    return teams[0] ?? null;
  }

  async create(input: TeamCreateInput): Promise<Team> {
    const { data, error } = await this.supabase
      .from("teams")
      .insert({
        contingent_id: input.contingentId,
        category: input.category,
        name: input.name,
        short_name: input.shortName,
        manager: input.manager,
        head_coach: input.headCoach,
        status: "DRAFT",
        eligibility: "PENDING",
      })
      .select("id")
      .single();
    if (error) throw new Error("Unable to create team");
    const created = await this.getById(data.id);
    if (!created) throw new Error("Created team could not be loaded");
    return created;
  }

  async update(id: string, input: TeamUpdateInput): Promise<Team> {
    const update: Database["public"]["Tables"]["teams"]["Update"] = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.shortName !== undefined) update.short_name = input.shortName;
    if (input.manager !== undefined) update.manager = input.manager;
    if (input.headCoach !== undefined) update.head_coach = input.headCoach;
    const { error } = await this.supabase.from("teams").update(update).eq("id", id);
    if (error) throw new Error("Unable to update team");
    const updated = await this.getById(id);
    if (!updated) throw new Error("Updated team could not be loaded");
    return updated;
  }

  async transitionStatus(id: string, targetStatus: Team["status"]): Promise<Team> {
    const { error } = await this.supabase.from("teams").update({ status: targetStatus }).eq("id", id);
    if (error) throw new Error("Unable to transition team status");
    const updated = await this.getById(id);
    if (!updated) throw new Error("Transitioned team could not be loaded");
    return updated;
  }

  delete(_id: string): Promise<void> {
    return Promise.reject(new Error("Team delete is not available in Batch 2.7"));
  }

  private async mapRows(rows: TeamRow[]): Promise<Team[]> {
    if (!rows.length) return [];
    const teamIds = rows.map((row) => row.id);
    const contingentIds = [...new Set(rows.map((row) => row.contingent_id))];
    const [{ data: contingents, error: contingentError }, { data: memberships, error: membershipError }, { data: counts, error: countError }] = await Promise.all([
      this.supabase.from("contingents").select("id, name").in("id", contingentIds),
      this.supabase.from("group_teams").select("team_id, group_id").in("team_id", teamIds),
      this.supabase.from("team_player_counts").select("team_id, player_count").in("team_id", teamIds),
    ]);
    if (contingentError || membershipError || countError) throw new Error("Unable to load team relationships");

    const groupIds = [...new Set(memberships.map((membership) => membership.group_id))];
    const { data: groups, error: groupError } = groupIds.length
      ? await this.supabase.from("groups").select("id, name").in("id", groupIds)
      : { data: [], error: null };
    if (groupError) throw new Error("Unable to load team groups");

    const contingentNames = new Map(contingents.map((contingent) => [contingent.id, contingent.name]));
    const groupNames = new Map(groups.map((group) => [group.id, group.name]));
    const membershipsByTeam = new Map(memberships.map((membership) => [membership.team_id, membership]));
    const countsByTeam = new Map(counts.map((count) => [count.team_id, count.player_count]));
    return rows.map((row) => {
      const membership = membershipsByTeam.get(row.id);
      const team = mapTeam(row, contingentNames.get(row.contingent_id), membership ? groupNames.get(membership.group_id) : undefined, countsByTeam.get(row.id) ?? 0);
      if (membership) team.groupId = membership.group_id;
      return team;
    });
  }
}
