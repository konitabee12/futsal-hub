import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@/lib/server";
import { getAuthorizationContext } from "@/lib/server";
import { SupabaseContingentRepository } from "@/repositories/supabase-contingent-repository";
import { ContingentService } from "@/services/contingent-service";
import type { Contingent } from "@/types/domain";
import type { AuditRepository } from "@/lib/audit";

const noOpAuditRepository: AuditRepository = {
  append: async () => undefined,
};

export async function listContingentsForRequest(): Promise<Contingent[]> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  const repository = new SupabaseContingentRepository(supabase);
  const service = new ContingentService(repository, noOpAuditRepository);
  return service.list(identity);
}