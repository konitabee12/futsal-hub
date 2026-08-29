import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminPlayerListDto } from "@/lib/dto";
import type { Database } from "@/types/database";
import type { EligibilityRepository } from "@/repositories/contracts";

interface PlayerEligibilityRow {
  id: string;
  team_id: string;
  name: string;
  number: number;
  position: string;
  birth_date: string;
  status: string;
  eligibility: string;
}

interface TeamForPlayer {
  id: string;
  name: string;
  contingent_id: string;
}

interface ContingentForPlayer {
  id: string;
  name: string;
}

export class SupabaseEligibilityRepository implements EligibilityRepository {
  private readonly playerColumns = "id, team_id, name, number, position, birth_date, status, eligibility";

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async listPlayersWithEligibility(): Promise<AdminPlayerListDto[]> {
    const { data: players, error: playersError } = await this.supabase
      .from("players")
      .select<string, PlayerEligibilityRow>(this.playerColumns);

    if (playersError) throw playersError;

    return Promise.all(
      (players ?? []).map((player) => this.enrichPlayerData(player))
    );
  }

  async getPlayerById(id: string): Promise<AdminPlayerListDto | null> {
    const { data: player, error: playerError } = await this.supabase
      .from("players")
      .select<string, PlayerEligibilityRow>(this.playerColumns)
      .eq("id", id)
      .single();

    if (playerError) {
      if (playerError.code === "PGRST116") return null;
      throw playerError;
    }

    return this.enrichPlayerData(player);
  }

  async updatePlayerEligibility(
    playerId: string,
    targetStatus: "ELIGIBLE" | "NOT_ELIGIBLE",
    reason?: string,
    notes?: string,
  ): Promise<AdminPlayerListDto> {
    // Update player eligibility status
    const { error: updateError } = await this.supabase
      .from("players")
      .update({ eligibility: targetStatus, updated_at: new Date().toISOString() })
      .eq("id", playerId);

    if (updateError) throw updateError;

    // Return updated player
    const updated = await this.getPlayerById(playerId);
    if (!updated) throw new Error("Failed to retrieve updated player");
    return updated;
  }

  private async enrichPlayerData(player: PlayerEligibilityRow): Promise<AdminPlayerListDto> {
    // Fetch team information
    const { data: team, error: teamError } = await this.supabase
      .from("teams")
      .select<string, TeamForPlayer>("id, name, contingent_id")
      .eq("id", player.team_id)
      .single();

    if (teamError && teamError.code !== "PGRST116") throw teamError;

    const teamName = team?.name ?? "";

    // Determine category from team or default
    let category: "PUTRA" | "PUTRI" = "PUTRA";
    if (team?.id) {
      const { data: categoryData } = await this.supabase
        .from("teams")
        .select("category")
        .eq("id", team.id)
        .single();

      if (categoryData?.category) {
        category = categoryData.category as "PUTRA" | "PUTRI";
      }
    }

    // Format birth year
    const birthYear = player.birth_date ? player.birth_date.split("-")[0] : "";

    return {
      id: player.id,
      teamId: player.team_id,
      teamName,
      name: player.name,
      number: player.number,
      position: player.position as any,
      birthYear,
      identityDisplay: "", // Privacy: not exposed in DTO
      status: player.status as any,
      eligibility: player.eligibility as any,
    };
  }
}
