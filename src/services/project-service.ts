import { supabase } from "@/lib/supabase"
import { ActivityService } from "@/services/activity-service"
import type { Database } from "@/types/database"

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"]
type ProjectTaskRow = Database["public"]["Tables"]["project_tasks"]["Row"]
type ProjectPhaseRow = Database["public"]["Tables"]["project_phases"]["Row"]
type ProjectRiskRow = Database["public"]["Tables"]["project_risks"]["Row"]
type GoalRow = Database["public"]["Tables"]["goals"]["Row"]

export type ProjectWithChildren = ProjectRow & {
  project_phases: ProjectPhaseRow[]
  project_tasks: ProjectTaskRow[]
  project_risks: ProjectRiskRow[]
}

export const ProjectService = {
  async getAll(): Promise<ProjectRow[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },

  async getById(id: string): Promise<ProjectWithChildren | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*, project_phases(*), project_tasks(*), project_risks(*), project_goals(goal_id)")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data as unknown as ProjectWithChildren
  },

  async create(input: ProjectInsert): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from("projects")
      .insert(input)
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "project_created",
      entity_type: "project",
      entity_id: data.id,
      description: `تم إنشاء مشروع: ${data.name}`,
    }).catch(() => {})
    return data
  },

  async update(id: string, input: ProjectUpdate): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from("projects")
      .update(input)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    if (input.status) {
      await ActivityService.log({
        activity_type: "project_status_changed",
        entity_type: "project",
        entity_id: data.id,
        description: `تغيرت حالة المشروع "${data.name}" إلى ${input.status}`,
      }).catch(() => {})
    }
    return data
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    await ActivityService.log({
      activity_type: "project_deleted",
      entity_type: "project",
      entity_id: id,
      description: "تم حذف مشروع",
    }).catch(() => {})
  },

  // Goal Links
  async linkGoal(projectId: string, goalId: string): Promise<void> {
    const { error } = await supabase
      .from("project_goals")
      .insert({ project_id: projectId, goal_id: goalId })

    if (error) throw error
  },

  async unlinkGoal(projectId: string, goalId: string): Promise<void> {
    const { error } = await supabase
      .from("project_goals")
      .delete()
      .eq("project_id", projectId)
      .eq("goal_id", goalId)

    if (error) throw error
  },

  async getLinkedGoals(projectId: string): Promise<GoalRow[]> {
    const { data, error } = await supabase
      .from("project_goals")
      .select("goal:goal_id(*)")
      .eq("project_id", projectId)

    if (error) throw error
    return (data as unknown as { goal: GoalRow[] }[] ?? []).map((r) => r.goal).flat()
  },

  async getLinkedProjects(goalId: string): Promise<ProjectRow[]> {
    const { data, error } = await supabase
      .from("project_goals")
      .select("project:project_id(*)")
      .eq("goal_id", goalId)

    if (error) throw error
    return (data as unknown as { project: ProjectRow[] }[] ?? []).map((r) => r.project).flat()
  },

  // Tasks
  async addTask(projectId: string, text: string): Promise<ProjectTaskRow> {
    const { data, error } = await supabase
      .from("project_tasks")
      .insert({ project_id: projectId, text })
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "task_created",
      entity_type: "project_task",
      entity_id: data.id,
      description: `تمت إضافة مهمة: ${text}`,
    }).catch(() => {})
    return data
  },

  async toggleTask(taskId: string, done: boolean): Promise<void> {
    const { error } = await supabase
      .from("project_tasks")
      .update({ done })
      .eq("id", taskId)

    if (error) throw error
    if (done) {
      await ActivityService.log({
        activity_type: "task_completed",
        entity_type: "project_task",
        entity_id: taskId,
        description: "تم إكمال مهمة مشروع",
      }).catch(() => {})
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", taskId)

    if (error) throw error
  },

  // Phases
  async addPhase(
    projectId: string,
    phase: { name: string; description?: string }
  ): Promise<ProjectPhaseRow> {
    const { data, error } = await supabase
      .from("project_phases")
      .insert({ project_id: projectId, ...phase })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updatePhase(
    phaseId: string,
    input: { name?: string; description?: string; status?: Database["public"]["Enums"]["phase_status"] }
  ): Promise<void> {
    const { error } = await supabase
      .from("project_phases")
      .update(input)
      .eq("id", phaseId)

    if (error) throw error
    if (input.status === "completed") {
      await ActivityService.log({
        activity_type: "phase_completed",
        entity_type: "project_phase",
        entity_id: phaseId,
        description: "تم إكمال مرحلة مشروع",
      }).catch(() => {})
    }
  },

  // Risks
  async addRisk(
    projectId: string,
    risk: { risk: string; probability?: string; impact?: string; mitigation?: string }
  ): Promise<ProjectRiskRow> {
    const { data, error } = await supabase
      .from("project_risks")
      .insert({ project_id: projectId, ...risk })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteRisk(riskId: string): Promise<void> {
    const { error } = await supabase
      .from("project_risks")
      .delete()
      .eq("id", riskId)

    if (error) throw error
  },
}
