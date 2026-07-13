import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DecisionService } from "@/services/decision-service"
import type { Database } from "@/types/database"

const KEYS = {
  all: ["decisions"] as const,
}

export function useDecisions() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => DecisionService.getAll(),
  })
}

export function useCreateDecision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Database["public"]["Tables"]["decisions"]["Insert"]) =>
      DecisionService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateDecision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Database["public"]["Tables"]["decisions"]["Update"]
    }) => DecisionService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteDecision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => DecisionService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
