import { supabase } from "@/lib/supabase"
import { ActivityService } from "@/services/activity-service"
import type { Database } from "@/types/database"

type DecisionRow = Database["public"]["Tables"]["decisions"]["Row"]
type DecisionInsert = Database["public"]["Tables"]["decisions"]["Insert"]
type DecisionUpdate = Database["public"]["Tables"]["decisions"]["Update"]

export const DecisionService = {
  async getAll(): Promise<DecisionRow[]> {
    const { data, error } = await supabase
      .from("decisions")
      .select("*")
      .order("decided_at", { ascending: false })

    if (error) throw error
    return data
  },

  async getByProject(projectId: string): Promise<DecisionRow[]> {
    const { data, error } = await supabase
      .from("decisions")
      .select("*")
      .eq("project_id", projectId)
      .order("decided_at", { ascending: false })

    if (error) throw error
    return data
  },

  async create(input: DecisionInsert): Promise<DecisionRow> {
    const { data, error } = await supabase
      .from("decisions")
      .insert(input)
      .select()
      .single()

    if (error) throw error
    await ActivityService.log({
      activity_type: "decision_created",
      entity_type: "decision",
      entity_id: data.id,
      description: `تم اتخاذ قرار: ${data.title}`,
    }).catch(() => {})
    return data
  },

  async update(id: string, input: DecisionUpdate): Promise<DecisionRow> {
    const { data, error } = await supabase
      .from("decisions")
      .update(input)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from("decisions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
  },
}
