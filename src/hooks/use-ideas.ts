import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { IdeaService } from "@/services/idea-service"
import type { Database } from "@/types/database"

const KEYS = { all: ["ideas"] as const }

export function useIdeas() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => IdeaService.getAll() })
}

export function useCreateIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Database["public"]["Tables"]["ideas"]["Insert"]) => IdeaService.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useUpdateIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Database["public"]["Tables"]["ideas"]["Update"] }) => IdeaService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => IdeaService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useConvertIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { ideaId: string; name: string; description?: string; user_id: string }) =>
      IdeaService.convertToProject(vars.ideaId, { name: vars.name, description: vars.description, user_id: vars.user_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ["projects"] }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}
