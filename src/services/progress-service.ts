import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"

type ProgressLogRow = Database["public"]["Tables"]["progress_logs"]["Row"]
type ProgressLogInsert = Database["public"]["Tables"]["progress_logs"]["Insert"]

export const ProgressService = {
  async getAll(): Promise<ProgressLogRow[]> {
    const { data, error } = await supabase
      .from("progress_logs")
      .select("*")
      .order("date", { ascending: false })
      .limit(90)

    if (error) throw error
    return data
  },

  async getByDate(date: string): Promise<ProgressLogRow | null> {
    const { data, error } = await supabase
      .from("progress_logs")
      .select("*")
      .eq("date", date)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data
  },

  async upsert(input: ProgressLogInsert): Promise<ProgressLogRow> {
    const { data, error } = await supabase
      .from("progress_logs")
      .upsert(input)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("progress_logs")
      .delete()
      .eq("id", id)

    if (error) throw error
  },
}
