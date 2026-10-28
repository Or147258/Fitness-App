import React, { useState } from 'react'
import { Dumbbell, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Segmented, toast } from '../components/ui'
import { hebrewError, resetPassword, signIn, signUp } from '../lib/sync'

/** מסך התחברות / הרשמה — מוצג לפני כל האפליקציה */
export default function AuthScreen() {
  const [mode, setMode] = useState('signin') // signin | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && password !== confirm) return setError('הסיסמאות לא תואמות')
    setBusy(true)
    try {
      if (mode === 'signin') await signIn(email, password)
      else if (mode === 'signup') await signUp(email, password)
      else {
        await resetPassword(email)
        toast('נשלח מייל לאיפוס סיסמה')
        setMode('signin')
      }
    } catch (err) {
      setError(hebrewError(err))
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (m) => { setMode(m); setError('') }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-safe pt-safe">
      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-lime-400 text-ink-950 shadow-[0_10px_30px_-10px_rgba(163,230,53,.7)]">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-3xl font-extrabold">יומן כושר</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            {mode === 'reset' ? 'נשלח לך קישור לבחירת סיסמה חדשה' : 'משקל, אימונים ושיאים — הכל במקום אחד'}
          </p>
        </div>

        {mode !== 'reset' && (
          <Segmented
            className="mb-5"
            value={mode}
            onChange={switchMode}
            options={[{ value: 'signin', label: 'התחברות' }, { value: 'signup', label: 'הרשמה' }]}
          />
        )}

        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              className="input ps-10"
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              placeholder="email@example.com"
              aria-label="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'reset' && (
            <div className="relative">
              <Lock size={18} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                className="input pe-11 ps-10"
                type={show ? 'text' : 'password'}
                dir="ltr"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder={mode === 'signup' ? 'סיסמה (לפחות 6 תווים)' : 'סיסמה'}
                aria-label="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute end-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-zinc-500"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <div className="relative">
              <Lock size={18} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                className="input ps-10"
                type={show ? 'text' : 'password'}
                dir="ltr"
                autoComplete="new-password"
                placeholder="אימות סיסמה"
                aria-label="אימות סיסמה"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>
          )}

          <button className="btn-primary w-full" disabled={busy}>
            {busy && <span className="size-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />}
            {mode === 'signin' ? 'התחבר' : mode === 'signup' ? 'צור חשבון' : 'שלח קישור לאיפוס'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'signin' && (
            <button className="text-zinc-400 underline-offset-4 hover:underline" onClick={() => switchMode('reset')}>
              שכחתי סיסמה
            </button>
          )}
          {mode === 'reset' && (
            <button className="text-zinc-400 underline-offset-4 hover:underline" onClick={() => switchMode('signin')}>
              חזרה להתחברות
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** מסך טעינה קצר בזמן בדיקת ההתחברות */
export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="grid size-16 animate-pulse place-items-center rounded-3xl bg-lime-400 text-ink-950">
        <Dumbbell size={32} />
      </div>
    </div>
  )
}

/** מוצג אם לא הוגדרו משתני הסביבה של Firebase */
export function MissingConfig() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 pt-safe">
      <div className="card p-5">
        <h1 className="text-lg font-bold">חסרות הגדרות Firebase</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          כדי להתחבר צריך להגדיר את פרטי פרויקט ה-Firebase. מעתיקים את <code dir="ltr" className="text-zinc-200">.env.example</code> לקובץ{' '}
          <code dir="ltr" className="text-zinc-200">.env</code> וממלאים את הערכים (ב-Vercel: Settings ← Environment Variables), ואז בונים מחדש.
          ההוראות המלאות ב-README.
        </p>
      </div>
    </div>
  )
}
