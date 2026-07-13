import { supabase } from "@/lib/supabase"
import { ActivityService } from "@/services/activity-service"
import type { Database } from "@/types/database"

type IdeaRow = Database["public"]["Tables"]["ideas"]["Row"]
type IdeaInsert = Database["public"]["Tables"]["ideas"]["Insert"]
type IdeaUpdate = Database["public"]["Tables"]["ideas"]["Update"]

export const IdeaService = {
  async getAll(): Promise<IdeaRow[]> {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },

  async getByStatus(
    status: Database["public"]["Enums"]["idea_status"]
  ): Promise<IdeaRow[]> {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },

  async create(input: IdeaInsert): Promise<IdeaRow> {
    const { data, error } = await supabase
      .from("ideas")
      .insert(input)
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "idea_created",
      entity_type: "idea",
      entity_id: data.id,
      description: `تمت إضافة فكرة: ${data.title}`,
    }).catch(() => {})
    return data
  },

  async update(id: string, input: IdeaUpdate): Promise<IdeaRow> {
    const { data, error } = await supabase
      .from("ideas")
      .update(input)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from("ideas")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
  },

  /** Creates a project AND links it back to the idea in a single logical operation. */
  async convertToProject(
    ideaId: string,
    input: { name: string; description?: string; user_id: string }
  ): Promise<{ idea: IdeaRow; projectId: string }> {
    // 1. Create the project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({ name: input.name, description: input.description, user_id: input.user_id })
      .select()
      .single()

    if (projErr) throw projErr

    // 2. Link idea → project
    const { data: idea, error: ideaErr } = await supabase
      .from("ideas")
      .update({ status: "converted", converted_project_id: project.id })
      .eq("id", ideaId)
      .select()
      .single()

    if (ideaErr) throw ideaErr

    await ActivityService.log({
      activity_type: "idea_converted_to_project",
      entity_type: "idea",
      entity_id: ideaId,
      description: `تم تحويل الفكرة "${idea.title}" إلى مشروع "${project.name}"`,
      metadata: { project_id: project.id },
    }).catch(() => {})

    return { idea: idea as IdeaRow, projectId: project.id }
  },
}
