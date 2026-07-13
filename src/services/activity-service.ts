import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"

type ActivityLogRow = Database["public"]["Tables"]["activity_log"]["Row"]
type Json = Database["public"]["CompositeTypes"]["json"]

export const ActivityService = {
  async getAll(limit = 50): Promise<ActivityLogRow[]> {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  async log(input: {
    activity_type: string
    entity_type?: string
    entity_id?: string
    description: string
    metadata?: Record<string, unknown>
  }): Promise<ActivityLogRow> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id
    if (!userId) throw new Error("auth required for activity log")

    const { data, error } = await supabase
      .from("activity_log")
      .insert({ ...input, user_id: userId, metadata: input.metadata as Json | undefined })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
