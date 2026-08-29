import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PlayerCreateInput, PlayerReadRecord, PlayerRepository, PlayerUpdateInput } from "@/repositories/contracts";

type PlayerRow = Pick<
  Database["public"]["Tables"]["players"]["Row"],
  "id" | "team_id" | "name" | "number" | "position" | "birth_date" | "status" | "eligibility"
>;

const playerColumns = "id, team_id, name, number, position, birth_date, status, eligibility";

function maskIdentity(type: string, number: string | undefined): string {
  if (!number) return "-";
  return `${type} ••••${number.slice(-4)}`;
}

function birthYear(value: string): string {
  const year = value.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "-";
}

export class SupabasePlayerRepository implements PlayerRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(): Promise<PlayerReadRecord[]> {
    const { data, error } = await this.supabase.from("players").select(playerColumns).order("name");
    if (error) throw new Error("Unable to load players");
    return this.mapRows(data);
  }

  async getById(id: string): Promise<PlayerReadRecord | null> {
    const { data, error } = await this.supabase
      .from("players")
      .select(playerColumns)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error("Unable to load player");
    if (!data) return null;
    return (await this.mapRows([data]))[0] ?? null;
  }

  async create(input: PlayerCreateInput): Promise<PlayerReadRecord> {
    const { data: player, error: playerError } = await this.supabase
      .from("players")
      .insert({
        team_id: input.teamId,
        name: input.name,
        number: input.number,
        position: input.position,
        birth_date: input.birthDate,
        status: "DRAFT",
        eligibility: "PENDING",
      })
      .select("id")
      .single();
    if (playerError) throw new Error("Unable to create player");

    const { error: identityError } = await this.supabase.from("identities").insert({
      player_id: player.id,
      identity_type: input.identityType,
      identity_number: input.identityNumber,
    });
    if (identityError) throw new Error("Unable to create player identity");
    const created = await this.getById(player.id);
    if (!created) throw new Error("Created player could not be loaded");
    return created;
  }

  async update(id: string, input: PlayerUpdateInput): Promise<PlayerReadRecord> {
    const update: Database["public"]["Tables"]["players"]["Update"] = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.number !== undefined) update.number = input.number;
    if (input.position !== undefined) update.position = input.position;
    const { error } = await this.supabase.from("players").update(update).eq("id", id);
    if (error) throw new Error("Unable to update player");
    const updated = await this.getById(id);
    if (!updated) throw new Error("Updated player could not be loaded");
    return updated;
  }

  async transitionStatus(id: string, targetStatus: PlayerReadRecord["status"]): Promise<PlayerReadRecord> {
    const { error } = await this.supabase.from("players").update({ status: targetStatus }).eq("id", id);
    if (error) throw new Error("Unable to transition player status");
    const updated = await this.getById(id);
    if (!updated) throw new Error("Transitioned player could not be loaded");
    return updated;
  }

  private async mapRows(rows: PlayerRow[]): Promise<PlayerReadRecord[]> {
    if (!rows.length) return [];
    const playerIds = rows.map((row) => row.id);
    const teamIds = [...new Set(rows.map((row) => row.team_id))];
    const [{ data: teams, error: teamError }, { data: identities, error: identityError }] = await Promise.all([
      this.supabase.from("teams").select("id, contingent_id, name").in("id", teamIds),
      this.supabase.from("identities").select("player_id, identity_type, identity_number").in("player_id", playerIds),
    ]);
    if (teamError || identityError) throw new Error("Unable to load player relationships");

    const teamsById = new Map(teams.map((team) => [team.id, team]));
    const identitiesByPlayerId = new Map(
      identities.flatMap((identity) => identity.player_id ? [[identity.player_id, identity] as const] : []),
    );
    return rows.flatMap((row) => {
      const team = teamsById.get(row.team_id);
      if (!team) return [];
      const identity = identitiesByPlayerId.get(row.id);
      return [{
        id: row.id,
        teamId: row.team_id,
        contingentId: team.contingent_id,
        teamName: team.name,
        name: row.name,
        number: row.number,
        position: row.position as PlayerReadRecord["position"],
        birthYear: birthYear(row.birth_date),
        identityDisplay: maskIdentity(identity?.identity_type ?? "IDENTITAS", identity?.identity_number),
        status: row.status as PlayerReadRecord["status"],
        eligibility: row.eligibility as PlayerReadRecord["eligibility"],
      }];
    });
  }
}
