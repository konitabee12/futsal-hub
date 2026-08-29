import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/query-keys";
import { listPlayersEligibility, getPlayerEligibility, decidePlayerEligibility } from "@/server-functions/eligibility";
import type { AdminPlayerListDto } from "@/lib/dto";
import type { EligibilityDecisionInput } from "@/services/eligibility-service";

export function usePlayersEligibility() {
  return useQuery({
    queryKey: queryKeys.eligibility.all(),
    queryFn: () => listPlayersEligibility(),
  });
}

export function usePlayerEligibility(playerId: string) {
  return useQuery<AdminPlayerListDto | null>({
    queryKey: queryKeys.eligibility.detail(playerId),
    queryFn: async () => getPlayerEligibility(playerId),
  });
}

export function useEligibilityDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EligibilityDecisionInput) => decidePlayerEligibility(input),
    onSuccess: (data) => {
      // Invalidate list and detail for this player
      queryClient.invalidateQueries({ queryKey: queryKeys.eligibility.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.eligibility.detail(data.id) });
    },
  });
}
