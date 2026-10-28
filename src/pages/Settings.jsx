import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Cloud, CloudOff, Download, LogOut, RefreshCw, Smartphone, Upload } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageHeader, Segmented, Stepper, Toggle, ConfirmSheet, toast } from '../components/ui'
import { fmtClock } from '../lib/date'
import { logOut, syncNow, useSyncStatus } from '../lib/sync'

function Section({ title, children }) {
  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <div className="card px-4 py-3">{children}</div>
    </section>
  )
}

function Account() {
  const { user, status, error } = useSyncStatus()
  const outbox = useStore((s) => s.outbox.length)
  const lastSyncAt = useStore((s) => s.lastSyncAt)
  const active = useStore((s) => !!s.active)
  const [confirmOut, setConfirmOut] = useState(false)
  const [busy, setBusy] = useState(false)

  const statusText = {
    idle: lastSyncAt ? `מסונכרן · ${new Date(lastSyncAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}` : 'מסונכרן',
    syncing: 'מסנכרן…',
    pending: 'השינויים נשמרו וממתינים לשליחה',
    offline: 'אין חיבור — השינויים יישלחו כשתחזור הקליטה',
    error: `שגיאה: ${error}`,
  }[status]

  const doLogOut = async () => {
    setBusy(true)
    try { await logOut() } catch (err) { toast(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3 py-1">
      <div className="flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-lime-400/15 text-lg font-bold text-lime-300">
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" dir="ltr" style={{ textAlign: 'right' }}>{user?.email}</div>
          <div className={`flex items-center gap-1 text-xs ${status === 'error' ? 'text-rose-300' : 'text-zinc-500'}`}>
            {status === 'offline' ? <CloudOff size={12} /> : <Cloud size={12} />}
            <span className="truncate">{statusText}{outbox > 0 && status !== 'error' && ` · ${outbox} ממתינים`}</span>
          </div>
        </div>
        <button className="btn-icon" onClick={() => syncNow()} disabled={status === 'syncing'} aria-label="סנכרן עכשיו">
          <RefreshCw size={16} className={status === 'syncing' ? 'animate-spin' : ''} />
        </button>
      </div>
      <button className="btn-danger w-full" onClick={() => setConfirmOut(true)} disabled={busy}>
        <LogOut size={16} /> התנתק
      </button>
      <ConfirmSheet
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        title="להתנתק מהחשבון?"
        message={
          (active ? 'יש אימון פעיל — הוא לא יישמר. ' : '') +
          'הנתונים שלך שמורים בענן ויחזרו כשתתחבר שוב. הם יימחקו מהמכשיר הזה.'
        }
        confirmText="התנתק"
        danger
        onConfirm={doLogOut}
      />
    </div>
  )
}

function InstallCard() {
  const [prompt, setPrompt] = useState(() => window.__installPrompt ?? null)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  useEffect(() => {
    const on = () => setPrompt(window.__installPrompt)
    window.addEventListener('installable', on)
    return () => window.removeEventListener('installable', on)
  }, [])
  if (standalone) return <p className="py-1 text-sm text-zinc-400">✓ האפליקציה מותקנת במסך הבית</p>
  if (prompt)
    return (
      <button className="btn-primary my-1 w-full" onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null) }}>
        <Smartphone size={18} /> התקן במסך הבית
      </button>
    )
  return (
    <p className="py-1 text-sm leading-relaxed text-zinc-400">
      {ios
        ? 'בספארי: לחץ על כפתור השיתוף ⎋ ובחר "הוסף למסך הבית".'
        : 'בכרום: פתח את התפריט ⋮ ובחר "התקן אפליקציה" / "הוסף למסך הבית".'}
    </p>
  )
}

export default function Settings() {
  const settings = useStore((s) => s.settings)
  const { updateSettings, exportData, importData } = useStore.getState()
  const fileRef = useRef(null)

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const doImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      importData(JSON.parse(await file.text()))
      toast('הגיבוי שוחזר')
    } catch (err) {
      toast(err.message ?? 'הקובץ לא תקין')
    }
  }

  return (
    <>
      <PageHeader title="הגדרות" back />
      <div className="px-4 pb-6">
        <Section title="החשבון שלי"><Account /></Section>

        <Section title="אימון">
          <label className="label pt-1">טיימר מנוחה ברירת מחדל</label>
          <Stepper value={settings.restSec} min={15} max={600} step={15} format={fmtClock} onChange={(v) => updateSettings({ restSec: v })} />
          <div className="mt-2 flex gap-2">
            {[60, 90, 120, 180].map((s) => (
              <button key={s} onClick={() => updateSettings({ restSec: s })} className={`h-8 flex-1 rounded-lg text-xs font-medium ${settings.restSec === s ? 'bg-lime-400 text-ink-950' : 'bg-white/[0.06] text-zinc-400'}`}>
                {fmtClock(s)}
              </button>
            ))}
          </div>
          <div className="mt-2 divide-y divide-white/5">
            <Toggle label="צליל בסיום מנוחה" checked={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
            <Toggle label="רטט בסיום מנוחה" hint="נתמך באנדרואיד" checked={settings.vibrate} onChange={(v) => updateSettings({ vibrate: v })} />
          </div>
        </Section>

        <Section title="מטרת משקל">
          <p className="mb-2 text-xs text-zinc-500">קובעת אם שינוי במשקל יוצג בירוק (בכיוון הרצוי) או באדום</p>
          <Segmented
            className="mb-1"
            value={settings.weightGoal}
            onChange={(v) => updateSettings({ weightGoal: v })}
            options={[{ value: 'cut', label: 'חיטוב' }, { value: 'maintain', label: 'שמירה' }, { value: 'bulk', label: 'מסה' }]}
          />
        </Section>

        
        <Section title="התקנה כאפליקציה"><InstallCard /></Section>

        <Section title="נתונים">
          <div className="grid grid-cols-2 gap-2 py-1">
            <button className="btn-ghost" onClick={doExport}><Download size={16} /> ייצוא גיבוי</button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> שחזור מגיבוי</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={doImport} />
          </div>
        </Section>
      </div>

    </>
  )
}
