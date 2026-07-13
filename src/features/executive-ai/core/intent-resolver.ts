import type { IIntentResolver, ResolvedIntent, AIMessage, CapabilityId, ContextScope } from './types'

/**
 * KeywordIntentResolver — v1.0 implementation.
 *
 * Simple keyword-based intent detection.
 * Designed to be replaced by LLMIntentResolver later via the same IIntentResolver interface.
 */

interface IntentRule {
  keywords: string[]
  capability: CapabilityId
  contextScope: ContextScope
}

const INTENT_RULES: IntentRule[] = [
  {
    keywords: ['خطة', 'خطط', 'ابن', 'أنشئ خطة', 'تخطيط', 'plan', 'build plan', 'جدول', 'تنظيم'],
    capability: 'planning',
    contextScope: { include: ['goals', 'activeProjects', 'dailyPlan'] },
  },
  {
    keywords: ['راجع', 'مراجعة', 'أداء', 'تقرير', 'review', 'reflect', 'حلل الأداء', 'أسبوعي', 'شهري', 'يومي'],
    capability: 'reflection',
    contextScope: { include: ['progress', 'activity', 'dailyPlan', 'metrics'], timeRange: 'week' },
  },
  {
    keywords: ['أولوية', 'رتب', 'ترتيب', 'مهم', 'عاجل', 'priority', 'prioritize', 'reorder', 'الأهم'],
    capability: 'prioritization',
    contextScope: { include: ['goals', 'activeProjects', 'dailyPlan'] },
  },
  {
    keywords: ['استراتيجي', 'استراتيجية', 'توافق', 'رؤية', 'strategy', 'strategic', 'alignment', 'محفظة', 'portfolio', 'مشاريع بلا أهداف', 'أهداف بلا مشاريع'],
    capability: 'strategy',
    contextScope: { include: ['goals', 'activeProjects', 'ideas', 'decisions'] },
  },
  {
    keywords: ['حلل', 'بيانات', 'مؤشر', 'metric', 'analysis', 'analyse', 'trend', 'انخفاض', 'تحسن', 'تراجع', 'ارتفاع', 'إحصاء', 'رسم'],
    capability: 'analysis',
    contextScope: { include: ['metrics', 'progress', 'activity', 'dashboard'] },
  },
]

export class KeywordIntentResolver implements IIntentResolver {
  async resolve(message: string, _history?: AIMessage[]): Promise<ResolvedIntent> {
    const lower = message.toLowerCase()

    // Score each rule by keyword match count
    let bestMatch: IntentRule | null = null
    let bestScore = 0

    for (const rule of INTENT_RULES) {
      const score = rule.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length
      if (score > bestScore) {
        bestScore = score
        bestMatch = rule
      }
    }

    if (bestMatch && bestScore > 0) {
      return {
        capability: bestMatch.capability,
        confidence: Math.min(bestScore / 3, 1.0),
        contextScope: bestMatch.contextScope,
        isAmbiguous: bestScore < 2,
      }
    }

    // Fallback: general capability
    return {
      capability: 'general',
      confidence: 0.3,
      contextScope: { include: ['dashboard', 'goals', 'activeProjects', 'dailyPlan'] },
      isAmbiguous: true,
    }
  }
}
