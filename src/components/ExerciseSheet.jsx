import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Link2, Trash2, Trophy } from 'lucide-react'
import { useStore } from '../store/useStore'
import { MUSCLES } from '../data/exercises'
import { ConfirmSheet, Sheet, toast } from './ui'
import { ExerciseMedia } from './ExerciseMedia'
import { computePRs, exerciseHistory, fmtPR, fmtSet } from '../lib/prs'
import { shortDate } from '../lib/date'
import { blobToDataUrl, compressImage, detectMediaType } from '../lib/media'

/** כרטיס תרגיל: מדיה, עריכה, שיא אישי והיסטוריה. exerciseId=null → יצירת תרגיל חדש */
export function ExerciseSheet({ open, onClose, exerciseId, defaultMuscle = 'chest' }) {
  const exercise = useStore((s) => s.exercises.find((e) => e.id === exerciseId))
  const sessions = useStore((s) => s.sessions)
  const { addExercise, updateExercise, deleteExercise } = useStore.getState()
  const isNew = !exerciseId
  const [form, setForm] = useState({ name: '', muscle: defaultMuscle, mediaUrl: '', notes: '' })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm(
      exercise
        ? { name: exercise.name, muscle: exercise.muscle, mediaUrl: exercise.mediaUrl ?? '', notes: exercise.notes ?? '' }
        : { name: '', muscle: defaultMuscle === 'all' ? 'chest' : defaultMuscle, mediaUrl: '', notes: '' },
    )
  }, [open, exercise, defaultMuscle])

  const pr = useMemo(() => (exerciseId ? computePRs(sessions)[exerciseId] : null), [sessions, exerciseId])
  const history = useMemo(() => (exerciseId ? exerciseHistory(sessions, exerciseId, 8) : []), [sessions, exerciseId])

  const save = () => {
    if (!form.name.trim()) return toast('צריך שם לתרגיל')
    const data = { ...form, name: form.name.trim(), mediaUrl: form.mediaUrl.trim(), mediaType: detectMediaType(form.mediaUrl.trim()) }
    if (isNew) addExercise(data)
    else updateExercise(exerciseId, data)
    toast('נשמר')
    onClose()
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const isStill = file.type.startsWith('image/') && file.type !== 'image/gif'
    try {
      setUploading(true)
      if (isStill) {
        // התמונה מוקטנת ונשמרת בתוך מסמך התרגיל ב-Firestore (בלי Firebase Storage)
        const blob = await compressImage(file, 480, 0.75)
        const dataUrl = await blobToDataUrl(blob)
        setForm((f) => ({ ...f, mediaUrl: dataUrl }))
      } else {
        toast('לסרטון או GIF — הדבק קישור (למשל YouTube)')
      }
    } catch (err) {
      toast(err.message ?? 'ההעלאה נכשלה')
    } finally {
      setUploading(false)
    }
  }

  const preview = { ...exercise, ...form, mediaType: detectMediaType(form.mediaUrl) }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={isNew ? 'תרגיל חדש' : exercise?.name ?? ''}
        footer={<button className="btn-primary w-full" onClick={save}>{isNew ? 'הוסף למאגר' : 'שמור שינויים'}</button>}
      >
        <ExerciseMedia exercise={preview} />

        {!isNew && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-amber-400/10 p-3">
            <Trophy size={20} className="text-amber-300" />
            <div className="flex-1">
              <div className="text-xs text-amber-200/70">שיא אישי</div>
              <div className="font-bold text-amber-200">{fmtPR(pr)}</div>
            </div>
            {pr && <div className="text-xs text-amber-200/60">{shortDate(pr.date)}</div>}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="label">שם התרגיל</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">קבוצת שריר</label>
            <div className="grid grid-cols-3 gap-2">
              {MUSCLES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm({ ...form, muscle: m.id })}
                  className={`h-10 rounded-xl text-sm font-medium ${form.muscle === m.id ? 'bg-lime-400 text-ink-950' : 'bg-white/[0.06] text-zinc-300'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">תמונה / GIF / סרטון הדגמה</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className="input ps-10 text-sm"
                  dir="ltr"
                  placeholder="קישור (YouTube, mp4, jpg, gif)"
                  value={form.mediaUrl.startsWith('data:') ? '' : form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                />
              </div>
              <button type="button" className="btn-ghost h-12 w-12 px-0" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="העלאת קובץ">
                {uploading ? <span className="size-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" /> : <ImagePlus size={20} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
            </div>
            {form.mediaUrl.startsWith('data:') && (
              <p className="mt-1.5 text-xs text-zinc-500">
                תמונה שמורה במכשיר · <button className="text-rose-300" onClick={() => setForm({ ...form, mediaUrl: '' })}>הסר</button>
              </p>
            )}
          </div>
          <div>
            <label className="label">הערות טכניקה</label>
            <textarea
              className="input h-auto py-3 text-sm"
              rows={2}
              placeholder="למשל: מרפקים צמודים, ירידה איטית"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {history.length > 0 && (
          <>
            <h3 className="section-title">היסטוריה</h3>
            <ul className="divide-y divide-white/5 rounded-2xl bg-ink-800/60">
              {history.map((h) => (
                <li key={h.sessionId} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="w-10 text-xs text-zinc-500">{shortDate(h.date)}</span>
                  <span className="tabular flex-1 truncate text-zinc-300" dir="ltr">{h.sets.map(fmtSet).join('  ·  ')}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {!isNew && !exercise?.builtin && (
          <button className="btn-danger mt-6 w-full" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={18} /> מחק תרגיל
          </button>
        )}
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="למחוק את התרגיל?"
        message="התרגיל יוסר מהמאגר ומכל תוכניות האימון."
        confirmText="מחק"
        danger
        onConfirm={() => {
          if (deleteExercise(exerciseId)) { toast('התרגיל נמחק'); onClose() }
          else toast('אי אפשר למחוק תרגיל שמופיע בהיסטוריית האימונים')
        }}
      />
    </>
  )
}
