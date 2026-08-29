import { getRequest } from "@tanstack/react-start/server";
import { createClient, getAuthorizationContext } from "@/lib/server";
import { SupabaseEligibilityRepository } from "@/repositories/supabase-eligibility-repository";
import { EligibilityService } from "@/services/eligibility-service";
import { SupabaseAuditRepository } from "@/repositories/supabase-audit-repository";
import type { AdminPlayerListDto } from "@/lib/dto";
import type { EligibilityDecisionInput } from "@/services/eligibility-service";

export async function listPlayersEligibilityForRequest(): Promise<AdminPlayerListDto[]> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return new EligibilityService(new SupabaseEligibilityRepository(supabase)).listPlayers(identity);
}

export async function getPlayerEligibilityForRequest(playerId: string): Promise<AdminPlayerListDto | null> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  const player = await new SupabaseEligibilityRepository(supabase).getPlayerById(playerId);
  return player ?? null;
}

export async function decidePlayerEligibilityForRequest(input: EligibilityDecisionInput): Promise<AdminPlayerListDto> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  const service = new EligibilityService(
    new SupabaseEligibilityRepository(supabase),
    new SupabaseAuditRepository(supabase),
  );
  return service.decideEligibility(identity, input);
}
