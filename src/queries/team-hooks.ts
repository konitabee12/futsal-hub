import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTeam, listTeams, transitionTeam, updateTeam } from "@/server-functions/teams";
import { queryKeys } from "@/queries/query-keys";
import type { Team } from "@/types/domain";
import type { TeamCreateInput, TeamUpdateInput } from "@/repositories/contracts";

export function useRealTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all(),
    queryFn: () => listTeams(),
  });
}

export function useCreateRealTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TeamCreateInput) => createTeam({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contingents.all() });
    },
  });
}

export function useUpdateRealTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; input: TeamUpdateInput }) => updateTeam({ data }),
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(team.id) });
    },
  });
}

export function useTransitionRealTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; targetStatus: Team["status"] }) => transitionTeam({ data }),
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(team.id) });
    },
  });
}
