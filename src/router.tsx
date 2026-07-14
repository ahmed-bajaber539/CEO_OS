import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { ROUTES } from "@/lib/constants"

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"))
const ProjectsPage = lazy(() => import("@/features/projects/ProjectsPage"))
const ProjectDetailPage = lazy(() => import("@/features/projects/ProjectDetailPage"))
const GoalsPage = lazy(() => import("@/features/goals/GoalsPage"))
const DailyPage = lazy(() => import("@/features/daily/DailyPage"))
const IdeasPage = lazy(() => import("@/features/ideas/IdeasPage"))
const DecisionsPage = lazy(() => import("@/features/decisions/DecisionsPage"))
const MetricsPage = lazy(() => import("@/features/metrics/MetricsPage"))
const ExecutiveAIPage = lazy(() => import("@/features/executive-ai/chat/ExecutiveAIPage"))
const LoginPage = lazy(() => import("@/features/auth/LoginPage"))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
            <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
            <Route path={ROUTES.GOALS} element={<GoalsPage />} />
            <Route path={ROUTES.DAILY} element={<DailyPage />} />
            <Route path={ROUTES.IDEAS} element={<IdeasPage />} />
            <Route path={ROUTES.DECISIONS} element={<DecisionsPage />} />
            <Route path={ROUTES.METRICS} element={<MetricsPage />} />
            <Route path={ROUTES.EXECUTIVE_AI} element={<ExecutiveAIPage />} />
          </Route>
        </Route>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Suspense>
  )
}
