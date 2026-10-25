'use client'

import React from 'react'
import {
  FileText,
  Link as LinkIcon,
  ChevronRight,
  LucideIcon,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Icon & style maps (keyed by actionType)                           */
/* ------------------------------------------------------------------ */
type ActionType = 'sign' | 'tether'

const icons: Record<ActionType, LucideIcon> = {
  sign: FileText,
  tether: LinkIcon,
}

const styles: Record<
  ActionType,
  { border: string; icon: string; subtitle: string; ring: string }
> = {
  sign: {
    border: 'border-l-indigo-500',
    icon: 'text-indigo-500',
    subtitle: 'text-indigo-600',
    ring: 'focus-visible:ring-indigo-500',
  },
  tether: {
    border: 'border-l-emerald-500',
    icon: 'text-emerald-500',
    subtitle: 'text-emerald-600',
    ring: 'focus-visible:ring-emerald-500',
  },
}

/* ------------------------------------------------------------------ */
/*  Priority order (sign > tether)                                    */
/* ------------------------------------------------------------------ */
const typePriority: ActionType[] = ['sign', 'tether']

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export interface ActionItem {
  title: string
  subtitle?: string
  actionType: ActionType
  onClick?: () => void | Promise<void>
}

interface ActionItemsProps {
  actions: ActionItem[]
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function ActionItems({
  actions,
  className = '',
}: ActionItemsProps) {
  if (!actions?.length) return null

  const sorted = [...actions].sort(
    (a, b) => typePriority.indexOf(a.actionType) - typePriority.indexOf(b.actionType),
  )

  return (
    <section className={`bg-white rounded-lg shadow p-5 mb-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Action Items</h2>

      {/* Two items per row on ≥ sm screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sorted.map(({ title, subtitle, actionType, onClick }, idx) => {
          const Icon = icons[actionType]
          const style = styles[actionType]

          return (
            <button
              key={idx}
              type="button"
              onClick={onClick}
              className={`w-full bg-gray-50 rounded-lg p-4 flex items-start justify-between
                          text-left cursor-pointer transition
                          hover:-translate-y-0.5 hover:shadow-md
                          active:translate-y-0
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                          ${style.ring}
                          border-l-4 ${style.border}`}
            >
              {/* left: main icon + text */}
              <div className="flex">
                <Icon className={`w-6 h-6 mr-3 flex-shrink-0 ${style.icon}`} />

                <div>
                  <div className="font-semibold">{title}</div>
                  {subtitle && (
                    <div className={`text-sm ${style.subtitle}`}>{subtitle}</div>
                  )}
                </div>
              </div>

              {/* right: chevron cue */}
              <ChevronRight className="w-5 h-5 opacity-60" />
            </button>
          )
        })}
      </div>
    </section>
  )
}
