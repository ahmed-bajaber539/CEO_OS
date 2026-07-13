import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ProjectService } from "@/services/project-service"
import type { Database } from "@/types/database"

const KEYS = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
  linkedGoals: (id: string) => ["projects", id, "goals"] as const,
}

export function useProjects() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => ProjectService.getAll() })
}

export function useProject(id: string) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => ProjectService.getById(id), enabled: !!id })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Database["public"]["Tables"]["projects"]["Insert"]) => ProjectService.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Database["public"]["Tables"]["projects"]["Update"] }) => ProjectService.update(id, input),
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: KEYS.detail(id) }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ProjectService.softDelete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useLinkGoalToProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, goalId }: { projectId: string; goalId: string }) => ProjectService.linkGoal(projectId, goalId),
    onSuccess: (_, { projectId }) => { qc.invalidateQueries({ queryKey: KEYS.detail(projectId) }); qc.invalidateQueries({ queryKey: KEYS.linkedGoals(projectId) }) },
  })
}

export function useUnlinkGoalFromProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, goalId }: { projectId: string; goalId: string }) => ProjectService.unlinkGoal(projectId, goalId),
    onSuccess: (_, { projectId }) => { qc.invalidateQueries({ queryKey: KEYS.detail(projectId) }); qc.invalidateQueries({ queryKey: KEYS.linkedGoals(projectId) }) },
  })
}

export function useProjectGoals(projectId: string) {
  return useQuery({ queryKey: KEYS.linkedGoals(projectId), queryFn: () => ProjectService.getLinkedGoals(projectId), enabled: !!projectId })
}

export function useAddProjectTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, text }: { projectId: string; text: string }) => ProjectService.addTask(projectId, text),
    onSuccess: (_, { projectId }) => { qc.invalidateQueries({ queryKey: KEYS.detail(projectId) }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useToggleProjectTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean; projectId: string }) => ProjectService.toggleTask(taskId, done),
    onSuccess: (_, { projectId }) => { qc.invalidateQueries({ queryKey: KEYS.detail(projectId) }); qc.invalidateQueries({ queryKey: ["daily"] }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useAddProjectPhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, phase }: { projectId: string; phase: { name: string; description?: string } }) => ProjectService.addPhase(projectId, phase),
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: KEYS.detail(projectId) }),
  })
}

export function useAddProjectRisk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, risk }: { projectId: string; risk: { risk: string; probability?: string; impact?: string; mitigation?: string } }) => ProjectService.addRisk(projectId, risk),
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: KEYS.detail(projectId) }),
  })
}

export function useDeleteProjectTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, projectId }: { taskId: string; projectId: string }) => ProjectService.deleteTask(taskId),
    onSuccess: (_, { projectId }) => qc.invalidateQueries({ queryKey: KEYS.detail(projectId) }),
  })
}
