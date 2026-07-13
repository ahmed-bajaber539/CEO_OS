import { supabase } from "@/lib/supabase"
import { ActivityService } from "@/services/activity-service"
import type { Database } from "@/types/database"

type GoalRow = Database["public"]["Tables"]["goals"]["Row"]
type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"]
type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"]
type GoalIndicatorRow = Database["public"]["Tables"]["goal_indicators"]["Row"]
type GoalTaskRow = Database["public"]["Tables"]["goal_tasks"]["Row"]

export type GoalWithChildren = GoalRow & {
  goal_indicators: GoalIndicatorRow[]
  goal_tasks: GoalTaskRow[]
}

export const GoalService = {
  async getByType(
    goalType: Database["public"]["Enums"]["goal_type"]
  ): Promise<GoalRow[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_type", goalType)
      .order("sort_order", { ascending: true })

    if (error) throw error
    return data
  },

  async getById(id: string): Promise<GoalWithChildren | null> {
    const { data, error } = await supabase
      .from("goals")
      .select("*, goal_indicators(*), goal_tasks(*)")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data as unknown as GoalWithChildren
  },

  async getChildren(parentId: string): Promise<GoalRow[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("parent_goal_id", parentId)
      .order("sort_order", { ascending: true })

    if (error) throw error
    return data
  },

  async create(input: GoalInsert): Promise<GoalRow> {
    const { data, error } = await supabase
      .from("goals")
      .insert(input)
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "goal_created",
      entity_type: "goal",
      entity_id: data.id,
      description: `تم إنشاء هدف: ${data.title}`,
    }).catch(() => {})
    return data
  },

  async update(id: string, input: GoalUpdate): Promise<GoalRow> {
    const { data, error } = await supabase
      .from("goals")
      .update(input)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    if (input.status) {
      await ActivityService.log({
        activity_type: "goal_status_changed",
        entity_type: "goal",
        entity_id: data.id,
        description: `تغيرت حالة الهدف "${data.title}" إلى ${input.status}`,
      }).catch(() => {})
    }
    return data
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from("goals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    await ActivityService.log({
      activity_type: "goal_deleted",
      entity_type: "goal",
      entity_id: id,
      description: "تم حذف هدف",
    }).catch(() => {})
  },

  // Project Links (delegates to project_goals)
  async linkProject(goalId: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from("project_goals")
      .insert({ goal_id: goalId, project_id: projectId })

    if (error) throw error
  },

  async unlinkProject(goalId: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from("project_goals")
      .delete()
      .eq("goal_id", goalId)
      .eq("project_id", projectId)

    if (error) throw error
  },

  // Indicators
  async addIndicator(
    goalId: string,
    indicator: { label: string; target?: string; current?: string }
  ): Promise<GoalIndicatorRow> {
    const { data, error } = await supabase
      .from("goal_indicators")
      .insert({ goal_id: goalId, ...indicator })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateIndicator(
    indicatorId: string,
    input: Partial<Pick<GoalIndicatorRow, "label" | "target" | "current">>
  ): Promise<void> {
    const { error } = await supabase
      .from("goal_indicators")
      .update(input)
      .eq("id", indicatorId)

    if (error) throw error
  },

  async deleteIndicator(indicatorId: string): Promise<void> {
    const { error } = await supabase
      .from("goal_indicators")
      .delete()
      .eq("id", indicatorId)

    if (error) throw error
  },

  // Tasks
  async addTask(goalId: string, text: string): Promise<GoalTaskRow> {
    const { data, error } = await supabase
      .from("goal_tasks")
      .insert({ goal_id: goalId, text })
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "task_created",
      entity_type: "goal_task",
      entity_id: data.id,
      description: `تمت إضافة مهمة هدف: ${text}`,
    }).catch(() => {})
    return data
  },

  async toggleTask(taskId: string, done: boolean): Promise<void> {
    const { error } = await supabase
      .from("goal_tasks")
      .update({ done })
      .eq("id", taskId)

    if (error) throw error
    if (done) {
      await ActivityService.log({
        activity_type: "task_completed",
        entity_type: "goal_task",
        entity_id: taskId,
        description: "تم إكمال مهمة هدف",
      }).catch(() => {})
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("goal_tasks")
      .delete()
      .eq("id", taskId)

    if (error) throw error
  },
}
