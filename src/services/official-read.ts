import { getRequest } from "@tanstack/react-start/server";
import { createClient, getAuthorizationContext } from "@/lib/server";
import type { AdminOfficialListDto } from "@/lib/dto";
import { SupabaseOfficialRepository } from "@/repositories/supabase-official-repository";
import { OfficialService } from "@/services/official-service";

export async function listOfficialsForRequest(): Promise<AdminOfficialListDto[]> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return new OfficialService(new SupabaseOfficialRepository(supabase)).list(identity);
}
