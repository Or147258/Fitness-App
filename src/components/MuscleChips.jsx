import React from 'react'
import { MUSCLES } from '../data/exercises'

export function MuscleChips({ value, onChange, includeAll = true }) {
  const items = includeAll ? [{ id: 'all', name: 'הכל' }, ...MUSCLES] : MUSCLES
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {items.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium transition ${
            value === m.id ? 'bg-lime-400 text-ink-950' : 'bg-white/[0.06] text-zinc-300'
          }`}
        >
          {m.name}
        </button>
      ))}
    </div>
  )
}

export function MuscleTag({ muscle }) {
  const m = MUSCLES.find((x) => x.id === muscle)
  if (!m) return null
  return <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${m.chip}`}>{m.name}</span>
}
