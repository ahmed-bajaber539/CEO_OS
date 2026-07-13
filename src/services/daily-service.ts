import { supabase } from "@/lib/supabase"
import { ActivityService } from "@/services/activity-service"
import type { Database } from "@/types/database"

type DailyPlanRow = Database["public"]["Tables"]["daily_plans"]["Row"]
type DailyPlanInsert = Database["public"]["Tables"]["daily_plans"]["Insert"]
type DailyTaskRow = Database["public"]["Tables"]["daily_tasks"]["Row"]
type DailyAssignmentRow = Database["public"]["Tables"]["daily_task_assignments"]["Row"]

export type DailyPlanWithTasks = DailyPlanRow & {
  daily_tasks: DailyTaskRow[]
  daily_task_assignments: (DailyAssignmentRow & {
    project_task?: Database["public"]["Tables"]["project_tasks"]["Row"]
    goal_task?: Database["public"]["Tables"]["goal_tasks"]["Row"]
  })[]
}

export const DailyService = {
  async getByDate(date: string): Promise<DailyPlanWithTasks | null> {
    const { data, error } = await supabase
      .from("daily_plans")
      .select(`*, 
        daily_tasks(*), 
        daily_task_assignments(*, 
          project_task:project_task_id(*), 
          goal_task:goal_task_id(*)
        )`)
      .eq("date", date)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data as unknown as DailyPlanWithTasks
  },

  async upsert(input: DailyPlanInsert): Promise<DailyPlanRow> {
    const { data, error } = await supabase
      .from("daily_plans")
      .upsert(input, { onConflict: "user_id,date" })
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "daily_plan_created",
      entity_type: "daily_plan",
      entity_id: data.id,
      description: `تم إنشاء خطة يومية لتاريخ ${input.date || ""}`,
    }).catch(() => {})
    return data
  },

  async updateNotes(
    id: string,
    field: "notes" | "blockers" | "tomorrow_plan",
    value: string
  ): Promise<void> {
    const { error } = await supabase
      .from("daily_plans")
      .update({ [field]: value } as never)
      .eq("id", id)

    if (error) throw error
  },

  // Tasks
  async addTask(
    dailyPlanId: string,
    task: { text: string; priority?: Database["public"]["Enums"]["priority_level"] }
  ): Promise<DailyTaskRow> {
    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({ daily_plan_id: dailyPlanId, ...task })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async toggleTask(taskId: string, done: boolean): Promise<void> {
    const { error } = await supabase
      .from("daily_tasks")
      .update({ done })
      .eq("id", taskId)

    if (error) throw error
    if (done) {
      await ActivityService.log({
        activity_type: "task_completed",
        entity_type: "daily_task",
        entity_id: taskId,
        description: "تم إكمال مهمة يومية",
      }).catch(() => {})
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId)

    if (error) throw error
  },

  async updateTaskPriority(
    taskId: string,
    priority: Database["public"]["Enums"]["priority_level"]
  ): Promise<void> {
    const { error } = await supabase
      .from("daily_tasks")
      .update({ priority })
      .eq("id", taskId)

    if (error) throw error
  },

  // Task Assignments — pull tasks from Projects/Goals into Daily Plan
  async assignProjectTask(
    dailyPlanId: string,
    projectTaskId: string,
    sortOrder = 0
  ): Promise<DailyAssignmentRow> {
    const { data, error } = await supabase
      .from("daily_task_assignments")
      .insert({ daily_plan_id: dailyPlanId, project_task_id: projectTaskId, sort_order: sortOrder })
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "task_assigned_to_daily",
      entity_type: "daily_task_assignment",
      entity_id: data.id,
      description: "تم سحب مهمة مشروع إلى خطة اليوم",
    }).catch(() => {})
    return data
  },

  async assignGoalTask(
    dailyPlanId: string,
    goalTaskId: string,
    sortOrder = 0
  ): Promise<DailyAssignmentRow> {
    const { data, error } = await supabase
      .from("daily_task_assignments")
      .insert({ daily_plan_id: dailyPlanId, goal_task_id: goalTaskId, sort_order: sortOrder })
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "task_assigned_to_daily",
      entity_type: "daily_task_assignment",
      entity_id: data.id,
      description: "تم سحب مهمة هدف إلى خطة اليوم",
    }).catch(() => {})
    return data
  },

  async unassignTask(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from("daily_task_assignments")
      .delete()
      .eq("id", assignmentId)

    if (error) throw error
  },

  async updateAssignmentSort(assignmentId: string, sortOrder: number): Promise<void> {
    const { error } = await supabase
      .from("daily_task_assignments")
      .update({ sort_order: sortOrder })
      .eq("id", assignmentId)

    if (error) throw error
  },
}
