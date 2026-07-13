import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DailyService } from "@/services/daily-service"
import type { Database } from "@/types/database"

const KEYS = {
  byDate: (date: string) => ["daily", date] as const,
}

export function useDaily(date: string) {
  return useQuery({
    queryKey: KEYS.byDate(date),
    queryFn: () => DailyService.getByDate(date),
    enabled: !!date,
  })
}

export function useUpsertDaily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: DailyService.upsert,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.byDate(data.date) })
      qc.invalidateQueries({ queryKey: ["activity"] })
    },
  })
}

export function useAddDailyTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      dailyPlanId: string
      text: string
      priority?: Database["public"]["Enums"]["priority_level"]
    }) =>
      DailyService.addTask(vars.dailyPlanId, { text: vars.text, priority: vars.priority }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily"] }),
  })
}

export function useToggleDailyTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { taskId: string; done: boolean }) =>
      DailyService.toggleTask(vars.taskId, vars.done),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily"] })
      qc.invalidateQueries({ queryKey: ["activity"] })
    },
  })
}

export function useDeleteDailyTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: DailyService.deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily"] }),
  })
}

// Task Assignments
export function useAssignProjectTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { dailyPlanId: string; projectTaskId: string; sortOrder?: number }) =>
      DailyService.assignProjectTask(vars.dailyPlanId, vars.projectTaskId, vars.sortOrder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily"] })
      qc.invalidateQueries({ queryKey: ["projects"] })
      qc.invalidateQueries({ queryKey: ["activity"] })
    },
  })
}

export function useAssignGoalTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { dailyPlanId: string; goalTaskId: string; sortOrder?: number }) =>
      DailyService.assignGoalTask(vars.dailyPlanId, vars.goalTaskId, vars.sortOrder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily"] })
      qc.invalidateQueries({ queryKey: ["goals"] })
      qc.invalidateQueries({ queryKey: ["activity"] })
    },
  })
}

export function useUnassignTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: DailyService.unassignTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily"] }),
  })
}
