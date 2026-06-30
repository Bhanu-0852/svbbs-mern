import { useMemo } from 'react'
import { FiTrendingUp, FiInfo } from 'react-icons/fi'

// Mirrors server/utils/kcRules.js — kept in sync so the estimate the
// student sees exactly matches what they'll be credited on submit.
const BASE_KC = { excellent: 300, good: 200, average: 100, poor: 25 }
const CATEGORY_BONUS = { engineering: 50, government_exam: 50, medical: 75, rare: 100 }

const CONDITION_LABEL = {
  excellent: 'Excellent',
  good: 'Good',
  average: 'Average',
  poor: 'Poor',
}

const CATEGORY_LABEL = {
  engineering: 'Engineering',
  government_exam: 'Government Exam',
  medical: 'Medical',
  rare: 'Rare',
}

/**
 * Live, exact KC estimate for a deposit. Computed client-side from the
 * same rules the server uses, so it updates instantly as the student
 * picks a condition and categories — no network call, no guesswork.
 * Only shown for the 'deposit' method (sell/exchange/donate don't earn KC).
 */
export default function DepositPriceHelper({ condition, categoryTags = [], depositMethod }) {
  const { base, bonuses, total } = useMemo(() => {
    const base = BASE_KC[condition] ?? BASE_KC.average
    const bonuses = categoryTags
      .filter((t) => CATEGORY_BONUS[t])
      .map((t) => ({ tag: t, value: CATEGORY_BONUS[t] }))
    const total = base + bonuses.reduce((s, b) => s + b.value, 0)
    return { base, bonuses, total }
  }, [condition, categoryTags])

  if (depositMethod !== 'deposit') return null

  // Suggest the nearest higher-value condition tier as an upgrade tip
  const tiers = ['poor', 'average', 'good', 'excellent']
  const currentIdx = tiers.indexOf(condition)
  const nextTier = currentIdx >= 0 && currentIdx < tiers.length - 1 ? tiers[currentIdx + 1] : null
  const nextTierGain = nextTier ? BASE_KC[nextTier] - BASE_KC[condition] : 0

  return (
    <div className="rounded-xl p-px bg-gradient-kc">
      <div className="rounded-[11px] bg-white dark:bg-navy-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiTrendingUp className="text-kc-500" size={15} />
          <span className="text-sm font-semibold text-navy-900 dark:text-white">
            Estimated KC value
          </span>
        </div>

        <div className="flex items-end gap-2 mb-3">
          <span className="font-mono-num text-3xl font-bold text-kc-500">{total}</span>
          <span className="text-sm text-slate-400 mb-1">KC</span>
        </div>

        {/* Breakdown */}
        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex justify-between">
            <span>{CONDITION_LABEL[condition] || condition} condition (base)</span>
            <span className="font-mono-num">{base} KC</span>
          </div>
          {bonuses.map((b) => (
            <div key={b.tag} className="flex justify-between text-forest-600 dark:text-forest-400">
              <span>+ {CATEGORY_LABEL[b.tag]} bonus</span>
              <span className="font-mono-num">+{b.value} KC</span>
            </div>
          ))}
          <div className="flex justify-between pt-1.5 mt-1.5 border-t border-slate-100 dark:border-navy-600 font-semibold text-navy-900 dark:text-white">
            <span>Total credited on deposit</span>
            <span className="font-mono-num">{total} KC</span>
          </div>
        </div>

        {/* Upgrade tip */}
        {nextTier && nextTierGain > 0 && (
          <div className="mt-3 flex items-start gap-1.5 text-2xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-navy-900 rounded-md px-2.5 py-2">
            <FiInfo size={12} className="mt-0.5 shrink-0 text-kc-500" />
            <span>
              If this book is closer to <strong>{CONDITION_LABEL[nextTier]}</strong> condition, you'd
              earn <strong className="text-kc-500">+{nextTierGain} KC</strong> more. Be honest — the
              condition is verified after deposit.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}