import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/query-keys";
import { createPlayer, listPlayers, transitionPlayer, updatePlayer } from "@/server-functions/players";
import type { Player } from "@/types/domain";
import type { PlayerCreateInput, PlayerUpdateInput } from "@/repositories/contracts";

export function useRealPlayers() {
  return useQuery({
    queryKey: queryKeys.players.all(),
    queryFn: () => listPlayers(),
  });
}

export function useCreateRealPlayer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (data: PlayerCreateInput) => createPlayer({ data }), onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.players.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() });
  }});
}
export function useUpdateRealPlayer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (data: { id: string; input: PlayerUpdateInput }) => updatePlayer({ data }), onSuccess: (player) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.players.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(player.id) });
  }});
}
export function useTransitionRealPlayer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (data: { id: string; targetStatus: Player["status"] }) => transitionPlayer({ data }), onSuccess: (player) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.players.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(player.id) });
  }});
}
