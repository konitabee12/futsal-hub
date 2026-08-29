import { getRequest } from "@tanstack/react-start/server";
import { createClient, getAuthorizationContext } from "@/lib/server";
import { SupabaseDocumentRepository } from "@/repositories/supabase-document-repository";
import { DocumentService } from "@/services/document-service";
import type { AdminDocumentListDto } from "@/lib/dto";

export async function listDocumentsForRequest(): Promise<AdminDocumentListDto[]> {
  const request = getRequest(); const { supabase } = createClient(request); const identity = await getAuthorizationContext(request);
  return new DocumentService(new SupabaseDocumentRepository(supabase)).list(identity);
}
