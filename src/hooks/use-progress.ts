import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ProgressService } from "@/services/progress-service"

const KEYS = {
  all: ["progress"] as const,
}

export function useProgress() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => ProgressService.getAll(),
  })
}

export function useUpsertProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ProgressService.upsert,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
