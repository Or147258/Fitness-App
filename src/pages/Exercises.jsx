import React from 'react'
import { useMemo, useState } from 'react'
import { Plus, Search, Trophy } from 'lucide-react'
import { useStore } from '../store/useStore'
import { MUSCLES } from '../data/exercises'
import { PageHeader } from '../components/ui'
import { MuscleChips } from '../components/MuscleChips'
import { ExerciseThumb } from '../components/ExerciseMedia'
import { ExerciseSheet } from '../components/ExerciseSheet'
import { filterExercises } from '../components/ExercisePicker'
import { computePRs, fmtPR } from '../lib/prs'

export default function Exercises() {
  const exercises = useStore((s) => s.exercises)
  const sessions = useStore((s) => s.sessions)
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState('all')
  const [openId, setOpenId] = useState(undefined) // undefined=סגור, null=חדש

  const prs = useMemo(() => computePRs(sessions), [sessions])
  const list = useMemo(() => filterExercises(exercises, q, muscle), [exercises, q, muscle])
  const groups = MUSCLES.map((m) => ({ ...m, items: list.filter((e) => e.muscle === m.id) })).filter((g) => g.items.length)

  return (
    <>
      <PageHeader
        title="מאגר תרגילים"
        subtitle={`${exercises.length} תרגילים`}
        action={
          <button className="btn-primary h-10 px-3 text-sm" onClick={() => setOpenId(null)}>
            <Plus size={18} /> חדש
          </button>
        }
      />
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-10 space-y-2 bg-ink-950/85 px-4 pb-3 backdrop-blur-xl">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="input ps-10" placeholder="חיפוש תרגיל..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <MuscleChips value={muscle} onChange={setMuscle} />
      </div>

      <div className="px-4">
        {groups.map((g) => (
          <section key={g.id}>
            <h2 className="section-title flex items-center gap-2">
              <span className={`size-2 rounded-full ${g.dot}`} /> {g.name}
              <span className="font-normal text-zinc-600">{g.items.length}</span>
            </h2>
            <ul className="card divide-y divide-white/5 overflow-hidden">
              {g.items.map((e) => (
                <li key={e.id}>
                  <button className="flex w-full items-center gap-3 p-3 text-start active:bg-white/5" onClick={() => setOpenId(e.id)}>
                    <ExerciseThumb exercise={e} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{e.name}</div>
                      {prs[e.id] ? (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-300/90">
                          <Trophy size={12} /> {fmtPR(prs[e.id])}
                        </div>
                      ) : (
                        <div className="mt-0.5 text-xs text-zinc-600">{e.builtin ? 'מאגר מובנה' : 'תרגיל שלי'}</div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!groups.length && <p className="py-12 text-center text-sm text-zinc-500">לא נמצאו תרגילים</p>}
      </div>

      <ExerciseSheet open={openId !== undefined} onClose={() => setOpenId(undefined)} exerciseId={openId} defaultMuscle={muscle} />
    </>
  )
}
