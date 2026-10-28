import React from 'react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Play, Plus, Trash2, X } from 'lucide-react'
import { useExerciseMap, useStore } from '../store/useStore'
import { PageHeader, ConfirmSheet, Empty, toast } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'
import { ExerciseThumb } from '../components/ExerciseMedia'
import { MuscleTag } from '../components/MuscleChips'

function MiniField({ label, children }) {
  return (
    <label className="flex flex-1 flex-col">
      <span className="mb-1 text-[11px] text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

export default function WorkoutEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const program = useStore((s) => s.programs.find((p) => p.id === id))
  const defaultRest = useStore((s) => s.settings.restSec)
  const active = useStore((s) => s.active)
  const exMap = useExerciseMap()
  const { renameProgram, updateProgramExercises, addExercisesToProgram, deleteProgram, startWorkout } = useStore.getState()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!program) return <Navigate to="/workouts" replace />

  const patch = (idx, p) => updateProgramExercises(id, (list) => list.map((x, i) => (i === idx ? { ...x, ...p } : x)))
  const move = (idx, dir) =>
    updateProgramExercises(id, (list) => {
      const j = idx + dir
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  const remove = (idx) => updateProgramExercises(id, (list) => list.filter((_, i) => i !== idx))

  return (
    <>
      <PageHeader title="עריכת אימון" back action={
        <button className="btn-icon text-rose-300" onClick={() => setConfirmDelete(true)} aria-label="מחק אימון"><Trash2 size={18} /></button>
      } />
      <div className="space-y-3 px-4">
        <div>
          <label className="label">שם האימון</label>
          <input className="input text-lg font-bold" value={program.name} onChange={(e) => renameProgram(id, e.target.value)} />
        </div>

        {!program.exercises.length && (
          <Empty title="אין עדיין תרגילים" text="הוסף תרגילים מהמאגר. אפשר לקבוע לכל תרגיל מספר סטים, טווח חזרות וזמן מנוחה." />
        )}

        <ol className="space-y-2">
          {program.exercises.map((pe, idx) => {
            const ex = exMap[pe.exerciseId]
            return (
              <li key={pe.uid} className="card p-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-zinc-500">{idx + 1}</span>
                  <ExerciseThumb exercise={ex} size="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{ex?.name ?? 'תרגיל שנמחק'}</div>
                    <MuscleTag muscle={ex?.muscle} />
                  </div>
                  <div className="flex">
                    <button className="p-1.5 text-zinc-500 disabled:opacity-20" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="הזז למעלה"><ChevronUp size={18} /></button>
                    <button className="p-1.5 text-zinc-500 disabled:opacity-20" disabled={idx === program.exercises.length - 1} onClick={() => move(idx, 1)} aria-label="הזז למטה"><ChevronDown size={18} /></button>
                    <button className="p-1.5 text-zinc-500 active:text-rose-300" onClick={() => remove(idx)} aria-label="הסר"><X size={18} /></button>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <MiniField label="סטים">
                    <input className="input tabular h-10 text-center" inputMode="numeric" value={pe.sets}
                      onChange={(e) => patch(idx, { sets: Math.min(12, parseInt(e.target.value, 10) || 0) })}
                      onBlur={() => !pe.sets && patch(idx, { sets: 1 })} />
                  </MiniField>
                  <MiniField label="חזרות (יעד)">
                    <input className="input tabular h-10 text-center" dir="ltr" value={pe.reps} placeholder="8-12" onChange={(e) => patch(idx, { reps: e.target.value })} />
                  </MiniField>
                  <MiniField label="מנוחה (שנ׳)">
                    <input className="input tabular h-10 text-center" inputMode="numeric" value={pe.restSec ?? ''} placeholder={String(defaultRest)}
                      onChange={(e) => patch(idx, { restSec: e.target.value === '' ? null : parseInt(e.target.value, 10) || 0 })} />
                  </MiniField>
                </div>
              </li>
            )
          })}
        </ol>

        <button className="btn-ghost h-12 w-full border border-dashed border-white/15" onClick={() => setPickerOpen(true)}>
          <Plus size={18} /> הוסף תרגילים מהמאגר
        </button>

        {program.exercises.length > 0 && (
          <button
            className="btn-primary w-full"
            onClick={() => {
              if (active) { toast('יש כבר אימון פעיל'); return navigate('/active') }
              startWorkout(id)
              navigate('/active')
            }}
          >
            <Play size={18} className="fill-current" /> התחל אימון
          </button>
        )}
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(ids) => addExercisesToProgram(id, ids)} />
      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`למחוק את "${program.name}"?`}
        message="האימונים שכבר ביצעת יישארו ביומן ובשיאים."
        confirmText="מחק"
        danger
        onConfirm={() => { deleteProgram(id); navigate('/workouts', { replace: true }) }}
      />
    </>
  )
}
