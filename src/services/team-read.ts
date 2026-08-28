import { getRequest } from "@tanstack/react-start/server";
import { getAuthorizationContext } from "@/lib/server";
import { createClient } from "@/lib/server";
import { SupabaseTeamRepository } from "@/repositories/supabase-team-repository";
import { TeamService } from "@/services/team-service";
import type { Team } from "@/types/domain";

export async function listTeamsForRequest(): Promise<Team[]> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return new TeamService(new SupabaseTeamRepository(supabase)).list(identity);
}