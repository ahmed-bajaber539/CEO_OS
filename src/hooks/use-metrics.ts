import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MetricService } from "@/services/metric-service"

const KEYS = {
  categories: ["metrics", "categories"] as const,
  values: (catId: string) => ["metrics", "values", catId] as const,
}

export function useMetricCategories() {
  return useQuery({
    queryKey: KEYS.categories,
    queryFn: () => MetricService.getCategories(),
  })
}

export function useMetricValues(categoryId: string) {
  return useQuery({
    queryKey: KEYS.values(categoryId),
    queryFn: () => MetricService.getLatestValues(categoryId),
    enabled: !!categoryId,
  })
}

export function useCreateMetricCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: MetricService.createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.categories }),
  })
}

export function useAddMetricValue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: MetricService.addValue,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.values(data.category_id) })
    },
  })
}

export function useDeleteMetricCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => MetricService.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.categories }),
  })
}

export function useDeleteMetricValue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ valueId, categoryId }: { valueId: string; categoryId: string }) => MetricService.deleteValue(valueId),
    onSuccess: (_, { categoryId }) => qc.invalidateQueries({ queryKey: KEYS.values(categoryId) }),
  })
}
