import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/query-keys";
import { listVerificationCases, getVerificationCase, decideVerificationCase } from "@/server-functions/verifications";
import type { AdminVerificationCaseListDto } from "@/lib/dto";
import type { VerificationDecisionInput } from "@/repositories/contracts";

export function useRealVerificationCases() {
  return useQuery({
    queryKey: queryKeys.verifications.all(),
    queryFn: () => listVerificationCases(),
  });
}

export function useRealVerificationCase(id: string) {
  return useQuery<AdminVerificationCaseListDto | null>({
    queryKey: queryKeys.verifications.detail(id),
    queryFn: async () => getVerificationCase(id),
  });
}

export function useVerificationDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerificationDecisionInput) => decideVerificationCase(input),
    onSuccess: (data) => {
      // Invalidate list and detail for this case
      queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.verifications.detail(data.id) });
    },
  });
}
