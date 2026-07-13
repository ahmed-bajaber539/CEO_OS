import { useQuery } from "@tanstack/react-query"
import { ActivityService } from "@/services/activity-service"

const KEYS = {
  all: ["activity"] as const,
}

export function useActivity(limit?: number) {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => ActivityService.getAll(limit),
  })
}
