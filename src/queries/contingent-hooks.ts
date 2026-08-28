import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Contingent } from "@/types/domain";
import type { ContingentRepository } from "@/repositories/contracts";
import { queryKeys } from "@/queries/query-keys";
import { listContingents } from "@/server-functions/contingents";
import {
  createContingent,
  transitionContingent,
  updateContingent,
} from "@/server-functions/contingents";

export function useRealContingents() {
  return useQuery({
    queryKey: queryKeys.contingents.all(),
    queryFn: () => listContingents(),
  });
}

export function useContingents(repository: ContingentRepository) {
  return useQuery({
    queryKey: queryKeys.contingents.all(),
    queryFn: () => repository.list(),
  });
}

export function useContingent(repository: ContingentRepository, id: string) {
  return useQuery({
    queryKey: queryKeys.contingents.detail(id),
    queryFn: () => repository.getById(id),
  });
}

export function useCreateContingent(repository: ContingentRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Contingent, "id">) => repository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.contingents.all() }),
  });
}

export function useUpdateContingent(repository: ContingentRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<Contingent, "id">> }) =>
      repository.update(id, input),
    onSuccess: (contingent) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contingents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contingents.detail(contingent.id) });
    },
  });
}

export function useCreateRealContingent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContingent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.contingents.all() }),
  });
}

export function useUpdateRealContingent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateContingent,
    onSuccess: (contingent) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contingents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contingents.detail(contingent.id) });
    },
  });
}

export function useTransitionRealContingent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transitionContingent,
    onSuccess: (contingent) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contingents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contingents.detail(contingent.id) });
    },
  });
}