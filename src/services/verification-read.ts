import { getRequest } from "@tanstack/react-start/server";
import { createClient, getAuthorizationContext } from "@/lib/server";
import { SupabaseVerificationRepository } from "@/repositories/supabase-verification-repository";
import { VerificationService } from "@/services/verification-service";
import { SupabaseAuditRepository } from "@/repositories/supabase-audit-repository";
import type { AdminVerificationCaseListDto } from "@/lib/dto";
import type { VerificationDecisionInput } from "@/repositories/contracts";

export async function listVerificationCasesForRequest(): Promise<AdminVerificationCaseListDto[]> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return new VerificationService(new SupabaseVerificationRepository(supabase)).list(identity);
}

export async function getVerificationCaseForRequest(id: string): Promise<AdminVerificationCaseListDto | null> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  return new VerificationService(new SupabaseVerificationRepository(supabase)).getById(identity, id);
}

export async function decideVerificationCaseForRequest(input: VerificationDecisionInput): Promise<AdminVerificationCaseListDto> {
  const request = getRequest();
  const { supabase } = createClient(request);
  const identity = await getAuthorizationContext(request);
  const service = new VerificationService(
    new SupabaseVerificationRepository(supabase),
    new SupabaseAuditRepository(supabase),
  );
  return service.decide(identity, input);
}
