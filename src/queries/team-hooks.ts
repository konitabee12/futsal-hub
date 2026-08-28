import { useQuery } from "@tanstack/react-query";
import { listTeams } from "@/server-functions/teams";
import { queryKeys } from "@/queries/query-keys";

export function useRealTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all(),
    queryFn: () => listTeams(),
  });
}