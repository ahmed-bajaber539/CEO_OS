import type { IContextProvider, ContextScope, AIContext, AgentManifest } from './types'
import { ProjectService } from '@/services/project-service'
import { GoalService } from '@/services/goal-service'
import { DailyService } from '@/services/daily-service'
import { IdeaService } from '@/services/idea-service'
import { DecisionService } from '@/services/decision-service'
import { MetricService } from '@/services/metric-service'
import { ProgressService } from '@/services/progress-service'
import { ActivityService } from '@/services/activity-service'

/**
 * SmartContextBuilder — builds AIContext based on ContextScope.
 *
 * Fetches ONLY the data domains specified in the scope.
 * Always includes: timestamp, date, day of week, dashboard summary.
 * Each domain fetch is wrapped in try/catch — a single failure doesn't crash the build.
 */
export class SmartContextBuilder implements IContextProvider {

  constructor(manifest: AgentManifest) {
    // manifest stored for future context-aware optimizations
  }

  async build(scope: ContextScope): Promise<AIContext> {
    const now = new Date()
    const today = now.toISOString().slice(0, 10) // YYYY-MM-DD

    // Base context — always included
    const context: AIContext = {
      timestamp: now.toISOString(),
      date: today,
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      dashboard: {
        activeProjects: 0,
        todayTasksDone: 0,
        todayTasksTotal: 0,
        annualGoals: 0,
        totalDecisions: 0,
      },
    }

    // Fetch data in parallel — each domain independently
    const domains = scope.include ?? []
    const fetchPromises: Promise<void>[] = []

    // Dashboard summary (always computed)
    fetchPromises.push(this.fetchDashboard(today, context))

    // Conditional domain fetches
    if (domains.includes('goals')) {
      fetchPromises.push(this.fetchGoals(context))
    }
    if (domains.includes('activeProjects') || domains.includes('projects')) {
      fetchPromises.push(this.fetchProjects(context))
    }
    if (domains.includes('dailyPlan') || domains.includes('pendingTasks') || domains.includes('completedTasks')) {
      fetchPromises.push(this.fetchDailyPlan(today, context))
    }
    if (domains.includes('ideas')) {
      fetchPromises.push(this.fetchIdeas(context))
    }
    if (domains.includes('decisions')) {
      fetchPromises.push(this.fetchDecisions(context))
    }
    if (domains.includes('metrics')) {
      fetchPromises.push(this.fetchMetrics(context))
    }
    if (domains.includes('progress')) {
      fetchPromises.push(this.fetchProgress(context))
    }
    if (domains.includes('activity')) {
      fetchPromises.push(this.fetchActivity(context))
    }

    await Promise.allSettled(fetchPromises)

    return context
  }

  // ── Domain Fetchers ──────────────────────────────────────────

  private async fetchDashboard(today: string, ctx: AIContext): Promise<void> {
    try {
      const [projects, annualGoals, decisions, daily] = await Promise.all([
        ProjectService.getAll(),
        GoalService.getByType('annual' as never).catch(() => [] as never[]),
        DecisionService.getAll().catch(() => [] as never[]),
        DailyService.getByDate(today).catch(() => null),
      ])

      ctx.dashboard = {
        activeProjects: projects.filter((p: any) => p.status === 'active' || p.status === 'planning').length,
        todayTasksDone: daily?.daily_tasks?.filter((t: any) => t.done)?.length ?? 0,
        todayTasksTotal: daily?.daily_tasks?.length ?? 0,
        annualGoals: (annualGoals as any[]).length,
        totalDecisions: (decisions as any[]).length,
      }
    } catch (err) {
      console.error('[ContextBuilder] Dashboard fetch failed:', err)
    }
  }

  private async fetchGoals(ctx: AIContext): Promise<void> {
    try {
      const [annual, quarterly, monthly, weekly] = await Promise.all([
        GoalService.getByType('annual' as never),
        GoalService.getByType('quarterly' as never),
        GoalService.getByType('monthly' as never),
        GoalService.getByType('weekly' as never),
      ])
      ctx.goals = { annual, quarterly, monthly, weekly }
    } catch (err) {
      console.error('[ContextBuilder] Goals fetch failed:', err)
    }
  }

  private async fetchProjects(ctx: AIContext): Promise<void> {
    try {
      const projects = await ProjectService.getAll()
      ctx.activeProjects = projects
    } catch (err) {
      console.error('[ContextBuilder] Projects fetch failed:', err)
    }
  }

  private async fetchDailyPlan(date: string, ctx: AIContext): Promise<void> {
    try {
      ctx.dailyPlan = await DailyService.getByDate(date)
    } catch (err) {
      console.error('[ContextBuilder] Daily plan fetch failed:', err)
    }
  }

  private async fetchIdeas(ctx: AIContext): Promise<void> {
    try {
      const ideas = await IdeaService.getAll()
      ctx.ideas = ideas.filter((i: any) => !i.deleted_at)
    } catch (err) {
      console.error('[ContextBuilder] Ideas fetch failed:', err)
    }
  }

  private async fetchDecisions(ctx: AIContext): Promise<void> {
    try {
      const decisions = await DecisionService.getAll()
      ctx.decisions = decisions.filter((d: any) => !d.deleted_at)
    } catch (err) {
      console.error('[ContextBuilder] Decisions fetch failed:', err)
    }
  }

  private async fetchMetrics(ctx: AIContext): Promise<void> {
    try {
      ctx.metrics = await MetricService.getCategories()
    } catch (err) {
      console.error('[ContextBuilder] Metrics fetch failed:', err)
    }
  }

  private async fetchProgress(ctx: AIContext): Promise<void> {
    try {
      ctx.progressSummary = await ProgressService.getAll()
    } catch (err) {
      console.error('[ContextBuilder] Progress fetch failed:', err)
    }
  }

  private async fetchActivity(ctx: AIContext): Promise<void> {
    try {
      ctx.recentActivity = await ActivityService.getAll(30)
    } catch (err) {
      console.error('[ContextBuilder] Activity fetch failed:', err)
    }
  }
}
