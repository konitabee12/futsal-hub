import { getRequest } from "@tanstack/react-start/server";
import { createClient, getAuthorizationContext } from "@/lib/server";
import type { AdminPlayerListDto } from "@/lib/dto";
import { SupabasePlayerRepository } from "@/repositories/supabase-player-repository";
import { PlayerService } from "@/services/player-service";

export async function listPlayersForRequest(): Promise<AdminPlayerListDto[]> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return new PlayerService(new SupabasePlayerRepository(supabase)).list(identity);
}
