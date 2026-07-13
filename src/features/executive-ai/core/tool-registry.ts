import type { IToolRegistry, ToolDefinition, CapabilityId } from './types'
import { ProjectService } from '@/services/project-service'
import { GoalService } from '@/services/goal-service'
import { DailyService } from '@/services/daily-service'
import { IdeaService } from '@/services/idea-service'
import { DecisionService } from '@/services/decision-service'
import { MetricService } from '@/services/metric-service'
import { ProgressService } from '@/services/progress-service'
import { ActivityService } from '@/services/activity-service'
import { supabase } from '@/lib/supabase'

export class ToolRegistry implements IToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map()
  private _frozen = false

  register(tool: ToolDefinition): void {
    if (this._frozen) {
      throw new Error(`Tool Registry is frozen. Cannot register tool "${tool.name}".`)
    }
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`)
    }
    this.tools.set(tool.name, tool)
  }

  freeze(): void {
    this._frozen = true
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getByCategory(category: string): ToolDefinition[] {
    return this.getAll().filter((t) => t.category === category)
  }

  getForCapability(capability: CapabilityId): ToolDefinition[] {
    return this.getAll().filter((t) => t.capabilities.includes(capability))
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }
}

// ─── Factory ──────────────────────────────────────────────────

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry()

  // ── Projects ────────────────────────────────────────────────
  registry.register({
    name: 'projects_list',
    category: 'projects',
    capabilities: ['planning', 'prioritization', 'strategy', 'analysis', 'general'],
    description: 'جلب جميع المشاريع',
    requiresConfirmation: false,
    schema: { type: 'object', properties: {}, required: [] },
    execute: async () => ProjectService.getAll(),
  })

  registry.register({
    name: 'projects_get',
    category: 'projects',
    capabilities: ['planning', 'strategy', 'general'],
    description: 'جلب مشروع محدد بالتفصيل',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'معرف المشروع' } },
      required: ['id'],
    },
    execute: async (args) => ProjectService.getById(args.id as string),
  })

  registry.register({
    name: 'projects_create',
    category: 'projects',
    capabilities: ['planning', 'strategy', 'general'],
    description: 'إنشاء مشروع جديد',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'اسم المشروع' },
        description: { type: 'string', description: 'وصف المشروع (اختياري)' },
        goal: { type: 'string', description: 'الهدف العام للمشروع (اختياري)' },
        status: { type: 'string', enum: ['planning', 'active', 'on_hold', 'completed', 'archived'] },
      },
      required: ['name'],
    },
    execute: async (args) => {
      const { data } = await supabase.auth.getUser()
      return ProjectService.create({
        user_id: data.user!.id,
        name: args.name as string,
        description: args.description as string | undefined,
        goal: args.goal as string | undefined,
        status: (args.status as string | undefined) ?? 'planning',
      } as never)
    },
  })

  registry.register({
    name: 'projects_update',
    category: 'projects',
    capabilities: ['planning', 'general'],
    description: 'تحديث مشروع موجود',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'معرف المشروع' },
        name: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['planning', 'active', 'on_hold', 'completed', 'archived'] },
      },
      required: ['id'],
    },
    execute: async (args) => {
      const { id, ...input } = args
      return ProjectService.update(id as string, input as never)
    },
  })

  registry.register({
    name: 'projects_delete',
    category: 'projects',
    capabilities: ['planning', 'general'],
    description: 'حذف مشروع (حذف منطقي)',
    requiresConfirmation: true,
    schema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'معرف المشروع' } },
      required: ['id'],
    },
    execute: async (args) => ProjectService.softDelete(args.id as string),
  })

  registry.register({
    name: 'projects_addTask',
    category: 'projects',
    capabilities: ['planning', 'general'],
    description: 'إضافة مهمة إلى مشروع',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'معرف المشروع' },
        text: { type: 'string', description: 'نص المهمة' },
      },
      required: ['projectId', 'text'],
    },
    execute: async (args) =>
      ProjectService.addTask(args.projectId as string, args.text as string),
  })

  registry.register({
    name: 'projects_toggleTask',
    category: 'projects',
    capabilities: ['planning', 'general'],
    description: 'تحديد مهمة كمكتملة أو غير مكتملة',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        done: { type: 'boolean' },
      },
      required: ['taskId', 'done'],
    },
    execute: async (args) =>
      ProjectService.toggleTask(args.taskId as string, args.done as boolean),
  })

  registry.register({
    name: 'projects_linkGoal',
    category: 'projects',
    capabilities: ['planning', 'strategy', 'general'],
    description: 'ربط مشروع بهدف',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        goalId: { type: 'string' },
      },
      required: ['projectId', 'goalId'],
    },
    execute: async (args) =>
      ProjectService.linkGoal(args.projectId as string, args.goalId as string),
  })

  // ── Goals ───────────────────────────────────────────────────
  registry.register({
    name: 'goals_list',
    category: 'goals',
    capabilities: ['planning', 'prioritization', 'strategy', 'analysis', 'general'],
    description: 'جلب جميع الأهداف من نوع محدد',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        goalType: {
          type: 'string',
          enum: ['annual', 'quarterly', 'monthly', 'weekly'],
          description: 'نوع الهدف',
        },
      },
      required: ['goalType'],
    },
    execute: async (args) => GoalService.getByType(args.goalType as never),
  })

  registry.register({
    name: 'goals_create',
    category: 'goals',
    capabilities: ['planning', 'strategy', 'general'],
    description: 'إنشاء هدف جديد',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'عنوان الهدف' },
        description: { type: 'string', description: 'وصف الهدف (اختياري)' },
        goalType: { type: 'string', enum: ['annual', 'quarterly', 'monthly', 'weekly'] },
        status: { type: 'string', enum: ['active', 'completed', 'cancelled'] },
        parentGoalId: { type: 'string', description: 'معرف الهدف الأب (اختياري)' },
      },
      required: ['title', 'goalType'],
    },
    execute: async (args) => {
      const { data } = await supabase.auth.getUser()
      return GoalService.create({
        user_id: data.user!.id,
        title: args.title as string,
        description: args.description as string | undefined,
        goal_type: args.goalType as never,
        status: (args.status as string | undefined) ?? 'active',
        parent_goal_id: args.parentGoalId as string | undefined,
      } as never)
    },
  })

  registry.register({
    name: 'goals_update',
    category: 'goals',
    capabilities: ['planning', 'general'],
    description: 'تحديث هدف موجود',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['active', 'completed', 'cancelled'] },
      },
      required: ['id'],
    },
    execute: async (args) => {
      const { id, ...input } = args
      return GoalService.update(id as string, input as never)
    },
  })

  registry.register({
    name: 'goals_delete',
    category: 'goals',
    capabilities: ['planning', 'general'],
    description: 'حذف هدف (حذف منطقي)',
    requiresConfirmation: true,
    schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    execute: async (args) => GoalService.softDelete(args.id as string),
  })

  registry.register({
    name: 'goals_addTask',
    category: 'goals',
    capabilities: ['planning', 'general'],
    description: 'إضافة مهمة إلى هدف',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        goalId: { type: 'string' },
        text: { type: 'string' },
      },
      required: ['goalId', 'text'],
    },
    execute: async (args) =>
      GoalService.addTask(args.goalId as string, args.text as string),
  })

  registry.register({
    name: 'goals_toggleTask',
    category: 'goals',
    capabilities: ['planning', 'general'],
    description: 'تحديد مهمة هدف كمكتملة أو غير مكتملة',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        done: { type: 'boolean' },
      },
      required: ['taskId', 'done'],
    },
    execute: async (args) =>
      GoalService.toggleTask(args.taskId as string, args.done as boolean),
  })

  // ── Daily Planning ──────────────────────────────────────────
  registry.register({
    name: 'daily_get',
    category: 'daily',
    capabilities: ['planning', 'reflection', 'prioritization', 'general'],
    description: 'جلب خطة اليوم',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'التاريخ بصيغة YYYY-MM-DD' },
      },
      required: ['date'],
    },
    execute: async (args) => DailyService.getByDate(args.date as string),
  })

  registry.register({
    name: 'daily_addTask',
    category: 'daily',
    capabilities: ['planning', 'general'],
    description: 'إضافة مهمة إلى خطة اليوم',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        dailyPlanId: { type: 'string' },
        text: { type: 'string' },
        priority: { type: 'string', enum: ['urgent_important', 'important_not_urgent', 'urgent_not_important', 'not_urgent_not_important'] },
      },
      required: ['dailyPlanId', 'text'],
    },
    execute: async (args) =>
      DailyService.addTask(args.dailyPlanId as string, {
        text: args.text as string,
        priority: args.priority as never,
      }),
  })

  registry.register({
    name: 'daily_toggleTask',
    category: 'daily',
    capabilities: ['planning', 'reflection', 'general'],
    description: 'تحديد مهمة يومية كمكتملة',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        done: { type: 'boolean' },
      },
      required: ['taskId', 'done'],
    },
    execute: async (args) =>
      DailyService.toggleTask(args.taskId as string, args.done as boolean),
  })

  // ── Ideas ───────────────────────────────────────────────────
  registry.register({
    name: 'ideas_list',
    category: 'ideas',
    capabilities: ['strategy', 'general'],
    description: 'جلب جميع الأفكار',
    requiresConfirmation: false,
    schema: { type: 'object', properties: {}, required: [] },
    execute: async () => IdeaService.getAll(),
  })

  registry.register({
    name: 'ideas_create',
    category: 'ideas',
    capabilities: ['general'],
    description: 'إضافة فكرة جديدة',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['title'],
    },
    execute: async (args) => {
      const { data } = await supabase.auth.getUser()
      return IdeaService.create({
        user_id: data.user!.id,
        title: args.title as string,
        description: args.description as string | undefined,
        category: args.category as string | undefined,
        priority: (args.priority as never) ?? 'medium',
      } as never)
    },
  })

  registry.register({
    name: 'ideas_convertToProject',
    category: 'ideas',
    capabilities: ['strategy', 'planning', 'general'],
    description: 'تحويل فكرة إلى مشروع',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        ideaId: { type: 'string' },
        name: { type: 'string', description: 'اسم المشروع الجديد' },
        description: { type: 'string' },
      },
      required: ['ideaId', 'name'],
    },
    execute: async (args) => {
      const { data } = await supabase.auth.getUser()
      return IdeaService.convertToProject(args.ideaId as string, {
        name: args.name as string,
        description: args.description as string | undefined,
        user_id: data.user!.id,
      })
    },
  })

  registry.register({
    name: 'ideas_delete',
    category: 'ideas',
    capabilities: ['general'],
    description: 'حذف فكرة (حذف منطقي)',
    requiresConfirmation: true,
    schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    execute: async (args) => IdeaService.softDelete(args.id as string),
  })

  // ── Decisions ───────────────────────────────────────────────
  registry.register({
    name: 'decisions_list',
    category: 'decisions',
    capabilities: ['strategy', 'general'],
    description: 'جلب جميع القرارات',
    requiresConfirmation: false,
    schema: { type: 'object', properties: {}, required: [] },
    execute: async () => DecisionService.getAll(),
  })

  registry.register({
    name: 'decisions_create',
    category: 'decisions',
    capabilities: ['strategy', 'general'],
    description: 'تسجيل قرار جديد',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        reason: { type: 'string' },
        expectedImpact: { type: 'string' },
        projectId: { type: 'string' },
        goalId: { type: 'string' },
      },
      required: ['title'],
    },
    execute: async (args) => {
      const { data } = await supabase.auth.getUser()
      return DecisionService.create({
        user_id: data.user!.id,
        title: args.title as string,
        reason: args.reason as string | undefined,
        expected_impact: args.expectedImpact as string | undefined,
        project_id: args.projectId as string | undefined,
        goal_id: args.goalId as string | undefined,
      } as never)
    },
  })

  registry.register({
    name: 'decisions_delete',
    category: 'decisions',
    capabilities: ['general'],
    description: 'حذف قرار (حذف منطقي)',
    requiresConfirmation: true,
    schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    execute: async (args) => DecisionService.softDelete(args.id as string),
  })

  // ── Metrics ─────────────────────────────────────────────────
  registry.register({
    name: 'metrics_list',
    category: 'metrics',
    capabilities: ['reflection', 'analysis', 'general'],
    description: 'جلب جميع فئات المؤشرات',
    requiresConfirmation: false,
    schema: { type: 'object', properties: {}, required: [] },
    execute: async () => MetricService.getCategories(),
  })

  registry.register({
    name: 'metrics_getValues',
    category: 'metrics',
    capabilities: ['reflection', 'analysis', 'general'],
    description: 'جلب قيم مؤشر محدد',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: { categoryId: { type: 'string' } },
      required: ['categoryId'],
    },
    execute: async (args) =>
      MetricService.getLatestValues(args.categoryId as string),
  })

  registry.register({
    name: 'metrics_addValue',
    category: 'metrics',
    capabilities: ['general'],
    description: 'إضافة قيمة لمؤشر',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'string' },
        label: { type: 'string' },
        currentValue: { type: 'string' },
        targetValue: { type: 'string' },
        progress: { type: 'number' },
      },
      required: ['categoryId', 'label'],
    },
    execute: async (args) =>
      MetricService.addValue({
        category_id: args.categoryId as string,
        label: args.label as string,
        current_value: args.currentValue as string | undefined,
        target_value: args.targetValue as string | undefined,
        progress: args.progress as number | undefined,
      }),
  })

  // ── Progress ────────────────────────────────────────────────
  registry.register({
    name: 'progress_get',
    category: 'progress',
    capabilities: ['reflection', 'analysis', 'general'],
    description: 'جلب سجل التقدم',
    requiresConfirmation: false,
    schema: { type: 'object', properties: {}, required: [] },
    execute: async () => ProgressService.getAll(),
  })

  // ── Activity ────────────────────────────────────────────────
  registry.register({
    name: 'activity_getRecent',
    category: 'activity',
    capabilities: ['reflection', 'analysis', 'general'],
    description: 'جلب آخر النشاطات',
    requiresConfirmation: false,
    schema: {
      type: 'object',
      properties: { limit: { type: 'number' } },
      required: [],
    },
    execute: async (args) =>
      ActivityService.getAll((args?.limit as number) ?? 20),
  })

  // ── Dashboard Summary ───────────────────────────────────────
  registry.register({
    name: 'dashboard_getSummary',
    category: 'dashboard',
    capabilities: ['general'],
    description: 'جلب ملخص لوحة التحكم',
    requiresConfirmation: false,
    schema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      const [projects, annualGoals, activity] = await Promise.all([
        ProjectService.getAll(),
        GoalService.getByType('annual' as never),
        ActivityService.getAll(5),
      ])
      return { projects: projects.length, annualGoals: annualGoals.length, recentActivity: activity }
    },
  })

  // ── Freeze ──────────────────────────────────────────────────
  registry.freeze()
  return registry
}
