import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries/query-keys";
import { listDocuments } from "@/server-functions/documents";
export function useRealDocuments() { return useQuery({ queryKey: queryKeys.documents.all(), queryFn: () => listDocuments() }); }
