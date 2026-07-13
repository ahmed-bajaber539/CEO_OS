import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"

type MetricCategoryRow = Database["public"]["Tables"]["metric_categories"]["Row"]
type MetricValueRow = Database["public"]["Tables"]["metric_values"]["Row"]

export type MetricCategoryWithValues = MetricCategoryRow & {
  metric_values: MetricValueRow[]
}

export const MetricService = {
  async getCategories(): Promise<MetricCategoryRow[]> {
    const { data, error } = await supabase
      .from("metric_categories")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) throw error
    return data
  },

  async getCategoryWithLatest(categoryId: string): Promise<MetricCategoryWithValues | null> {
    const { data, error } = await supabase
      .from("metric_categories")
      .select("*, metric_values(*)")
      .eq("id", categoryId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data as unknown as MetricCategoryWithValues
  },

  async createCategory(input: {
    name: string
    icon?: string
    sort_order?: number
  }): Promise<MetricCategoryRow> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id
    if (!userId) throw new Error("auth required")

    const { data, error } = await supabase
      .from("metric_categories")
      .insert({ ...input, user_id: userId })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from("metric_categories")
      .delete()
      .eq("id", categoryId)

    if (error) throw error
  },

  // Values
  async getLatestValues(categoryId: string): Promise<MetricValueRow[]> {
    const { data, error } = await supabase
      .from("metric_values")
      .select("*")
      .eq("category_id", categoryId)
      .order("recorded_at", { ascending: false })
      .limit(30)

    if (error) throw error
    return data
  },

  async addValue(input: {
    category_id: string
    label: string
    current_value?: string
    target_value?: string
    progress?: number
  }): Promise<MetricValueRow> {
    const { data, error } = await supabase
      .from("metric_values")
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteValue(valueId: string): Promise<void> {
    const { error } = await supabase
      .from("metric_values")
      .delete()
      .eq("id", valueId)

    if (error) throw error
  },
}
