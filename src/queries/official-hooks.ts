import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries/query-keys";
import { listOfficials } from "@/server-functions/officials";

export function useRealOfficials() {
  return useQuery({ queryKey: queryKeys.officials.all(), queryFn: () => listOfficials() });
}
