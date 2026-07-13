import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { GoalService } from "@/services/goal-service"
import { ProjectService } from "@/services/project-service"
import type { Database } from "@/types/database"

type GoalType = Database["public"]["Enums"]["goal_type"]

const KEYS = {
  all: ["goals"] as const,
  byType: (type: GoalType) => ["goals", type] as const,
  detail: (id: string) => ["goals", "detail", id] as const,
  linkedProjects: (id: string) => ["goals", id, "projects"] as const,
}

export function useGoals(type: GoalType) {
  return useQuery({ queryKey: KEYS.byType(type), queryFn: () => GoalService.getByType(type) })
}

export function useGoal(id: string) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => GoalService.getById(id), enabled: !!id })
}

export function useGoalChildren(parentId: string) {
  return useQuery({ queryKey: [...KEYS.all, "children", parentId], queryFn: () => GoalService.getChildren(parentId), enabled: !!parentId })
}

export function useGoalProgress(goalId: string) {
  return useQuery({
    queryKey: [...KEYS.detail(goalId), "progress"],
    queryFn: async () => {
      const goal = await GoalService.getById(goalId)
      if (!goal?.goal_tasks) return null
      const completed = goal.goal_tasks.filter((t) => t.done).length
      const total = goal.goal_tasks.length
      return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
    },
    enabled: !!goalId,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Database["public"]["Tables"]["goals"]["Insert"]) => GoalService.create(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Database["public"]["Tables"]["goals"]["Update"] }) => GoalService.update(id, input),
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: KEYS.detail(id) }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => GoalService.softDelete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.all }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useLinkProjectToGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, projectId }: { goalId: string; projectId: string }) => GoalService.linkProject(goalId, projectId),
    onSuccess: (_, { goalId }) => { qc.invalidateQueries({ queryKey: KEYS.detail(goalId) }); qc.invalidateQueries({ queryKey: ["projects"] }) },
  })
}

export function useGoalProjects(goalId: string) {
  return useQuery({ queryKey: KEYS.linkedProjects(goalId), queryFn: () => ProjectService.getLinkedProjects(goalId), enabled: !!goalId })
}

export function useAddGoalIndicator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, indicator }: { goalId: string; indicator: { label: string; target?: string; current?: string } }) => GoalService.addIndicator(goalId, indicator),
    onSuccess: (_, { goalId }) => qc.invalidateQueries({ queryKey: KEYS.detail(goalId) }),
  })
}

export function useToggleGoalTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean; goalId: string }) => GoalService.toggleTask(taskId, done),
    onSuccess: (_, { goalId }) => { qc.invalidateQueries({ queryKey: KEYS.detail(goalId) }); qc.invalidateQueries({ queryKey: ["daily"] }); qc.invalidateQueries({ queryKey: ["activity"] }) },
  })
}

export function useAddGoalTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, text }: { goalId: string; text: string }) => GoalService.addTask(goalId, text),
    onSuccess: (_, { goalId }) => { qc.invalidateQueries({ queryKey: KEYS.detail(goalId) }); qc.invalidateQueries({ queryKey: KEYS.all }) },
  })
}

export function useDeleteGoalTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId }: { taskId: string; goalId: string }) => GoalService.deleteTask(taskId),
    onSuccess: (_, { goalId }) => { qc.invalidateQueries({ queryKey: KEYS.detail(goalId) }); qc.invalidateQueries({ queryKey: KEYS.all }) },
  })
}
