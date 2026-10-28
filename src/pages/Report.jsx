import React, { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Download, Printer, Share2 } from 'lucide-react'
import { canShareFiles, reportToPdf, shareOrDownload } from '../lib/pdf'
import { toast } from '../components/ui'
import { GLUCOSE_CONTEXTS, useStore } from '../store/useStore'
import { LineChart } from '../components/LineChart'
import { Copyright } from '../components/Copyright'
import { addDays, fromKey, toKey, weekStartKey } from '../lib/date'
import { dailyAverages, rollingAverage } from '../lib/weightStats'

const PERIODS = [
  { value: 30, label: '30 יום' },
  { value: 90, label: '3 חודשים' },
  { value: 180, label: '6 חודשים' },
  { value: 0, label: 'בחירה' },
]
const fmtD = (k) => { const d = fromKey(k); return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}` }
const fmtShort = (k) => { const d = fromKey(k); return `${d.getDate()}.${d.getMonth() + 1}` }
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
const n0 = (v) => (v == null ? '—' : Math.round(v))
const n1 = (v) => (v == null ? '—' : v.toFixed(1))

function Stats({ items }) {
  return (
    <div className="pdf-block grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-zinc-200 px-2 py-1.5">
          <div className="text-[10px] text-zinc-500">{label}</div>
          <div className="tabular text-sm font-bold">{value}</div>
        </div>
      ))}
    </div>
  )
}

function Table({ head, rows, className = '' }) {
  return (
    <table className={`w-full border-collapse text-[10.5px] leading-tight ${className}`}>
      <thead>
        <tr className="bg-zinc-100">
          {head.map((h) => <th key={h} className="border border-zinc-200 px-1.5 py-1 text-start font-semibold">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="break-inside-avoid">
            {r.map((c, j) => <td key={j} className="tabular border border-zinc-200 px-1.5 py-0.5 align-top">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Section({ title, children }) {
  return (
    <section className="report-section mt-6">
      <h2 className="mb-2 border-b-2 border-zinc-800 pb-1 text-base font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export default function Report() {
  const navigate = useNavigate()
  const { weights, glucose, pressure, settings } = useStore()
  const updateSettings = useStore((s) => s.updateSettings)
  const today = toKey()
  const [period, setPeriod] = useState(30)
  const [customFrom, setCustomFrom] = useState(toKey(addDays(new Date(), -29)))
  const [customTo, setCustomTo] = useState(today)
  const [show, setShow] = useState({ weight: weights.length > 0, glucose: glucose.length > 0, pressure: pressure.length > 0 })
  const [name, setName] = useState(settings.reportName ?? '')

  const from = period ? toKey(addDays(fromKey(today), -(period - 1))) : customFrom
  const to = period ? today : customTo
  const inRange = (x) => x.date >= from && x.date <= to

  const W = useMemo(() => weights.filter(inRange), [weights, from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  const G = useMemo(() => glucose.filter(inRange), [glucose, from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  const B = useMemo(() => pressure.filter(inRange), [pressure, from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- משקל ---- */
  const weightWeeks = useMemo(() => {
    const m = new Map()
    for (const w of W) { const k = weekStartKey(w.date); if (!m.has(k)) m.set(k, []); m.get(k).push(w.kg) }
    return [...m.entries()].map(([k, a]) => [fmtShort(k), n1(avg(a)), n1(Math.min(...a)), n1(Math.max(...a)), a.length])
  }, [W])

  /* ---- סוכר ---- */
  const byContext = GLUCOSE_CONTEXTS.map((c) => {
    const v = G.filter((g) => g.context === c.id).map((g) => g.value)
    return v.length ? [c.label, v.length, n0(avg(v)), Math.min(...v), Math.max(...v)] : null
  }).filter(Boolean)
  const sugarDays = useMemo(() => {
    const m = new Map()
    for (const g of G) { if (!m.has(g.date)) m.set(g.date, []); m.get(g.date).push(g) }
    return [...m.entries()].map(([d, list]) => [
      fmtD(d),
      ...GLUCOSE_CONTEXTS.map((c) => list.filter((g) => g.context === c.id).map((g) => `${g.value} (${g.time})`).join(', ') || ''),
    ])
  }, [G])
  const sugarChart = ['fasting', 'after'].map((ctx) => ({
    label: ctx === 'fasting' ? 'בצום' : 'אחרי ארוחה',
    color: ctx === 'fasting' ? '#ea580c' : '#0891b2',
    points: dailyAverages(G.filter((g) => g.context === ctx)).map((d) => ({ date: d.date, v: d.kg })),
  })).filter((s) => s.points.length)
  const sugarAllPts = dailyAverages(G).map((d) => ({ date: d.date, v: d.kg }))

  /* ---- לחץ דם ---- */
  const pulses = B.map((x) => x.pulse).filter((v) => v != null)

  const saveName = (v) => { setName(v); updateSettings({ reportName: v }) }
  const nothing = !(show.weight && W.length) && !(show.glucose && G.length) && !(show.pressure && B.length)
  const pageRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const shareable = useMemo(canShareFiles, [])
  const makePdf = async (share) => {
    setBusy(true)
    try {
      const file = await reportToPdf(pageRef.current, `דוח-מדדים-${to}.pdf`)
      const r = await shareOrDownload(file, share)
      if (r === 'downloaded') toast('הקובץ נשמר בתיקיית ההורדות')
    } catch (err) {
      console.error(err)
      toast('יצירת ה-PDF נכשלה — נסה שוב')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-200 pb-10 print:bg-white print:pb-0">
      {/* סרגל כלים — לא מודפס */}
      <div className="no-print sticky top-0 z-20 border-b border-white/10 bg-ink-950/95 pt-safe text-zinc-100 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-icon rounded-full" aria-label="חזרה"><ChevronRight size={20} /></button>
            <h1 className="flex-1 text-lg font-bold">דוח לרופא</h1>
            <button className="btn-icon" onClick={() => window.print()} disabled={nothing} aria-label="הדפסה" title="הדפסה">
              <Printer size={18} />
            </button>
          </div>
          <div className={`grid gap-2 ${shareable ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button className="btn-primary h-11 text-sm" onClick={() => makePdf(false)} disabled={nothing || busy}>
              {busy ? <span className="size-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" /> : <Download size={17} />}
              שמור PDF
            </button>
            {shareable && (
              <button className="btn-ghost h-11 text-sm" onClick={() => makePdf(true)} disabled={nothing || busy}>
                <Share2 size={17} /> שלח (וואטסאפ / מייל)
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)} className={`h-8 rounded-full px-3 text-xs font-medium ${period === p.value ? 'bg-lime-400 text-ink-950' : 'bg-white/[0.07] text-zinc-300'}`}>{p.label}</button>
            ))}
          </div>
          {period === 0 && (
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="input h-10 px-3 text-sm" value={customFrom} max={customTo} onChange={(e) => e.target.value && setCustomFrom(e.target.value)} aria-label="מתאריך" />
              <input type="date" className="input h-10 px-3 text-sm" value={customTo} min={customFrom} max={today} onChange={(e) => e.target.value && setCustomTo(e.target.value)} aria-label="עד תאריך" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {[['weight', 'משקל'], ['glucose', 'סוכר'], ['pressure', 'לחץ דם']].map(([k, l]) => (
              <label key={k} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-xs">
                <input type="checkbox" className="accent-lime-400" checked={show[k]} onChange={(e) => setShow({ ...show, [k]: e.target.checked })} /> {l}
              </label>
            ))}
            <input className="input h-8 flex-1 px-3 text-xs" placeholder="שם שיופיע בדוח (לא חובה)" value={name} onChange={(e) => saveName(e.target.value)} />
          </div>
          {nothing && <p className="text-[11px] text-amber-300/80">אין נתונים בתקופה ובמדדים שנבחרו — בחר תקופה ארוכה יותר או מדד אחר.</p>}
        </div>
      </div>

      {/* הדף עצמו */}
      <article ref={pageRef} className="report-page mx-auto mt-4 max-w-3xl bg-white px-6 py-7 text-zinc-900 shadow-xl print:mt-0 print:max-w-none print:px-0 print:py-0 print:shadow-none sm:px-10">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-300 pb-3">
          <div>
            <h1 className="text-2xl font-extrabold">דוח מדדים</h1>
            {name && <p className="mt-0.5 text-base font-semibold">{name}</p>}
            <p className="mt-1 text-sm text-zinc-600">תקופה: <span dir="ltr">{fmtD(from)} – {fmtD(to)}</span></p>
          </div>
          <div className="text-end text-xs text-zinc-500">
            <div>הופק בתאריך</div>
            <div dir="ltr">{fmtD(today)}</div>
          </div>
        </header>

        {nothing && <p className="py-16 text-center text-sm text-zinc-500">אין נתונים בתקופה שנבחרה</p>}

        {show.weight && W.length > 0 && (
          <Section title="משקל (ק״ג)">
            <Stats items={[
              ['בתחילת התקופה', n1(W[0].kg)],
              ['בסוף התקופה', n1(W.at(-1).kg)],
              ['שינוי', <span dir="ltr">{(W.at(-1).kg - W[0].kg > 0 ? '+' : '') + (W.at(-1).kg - W[0].kg).toFixed(1)}</span>],
              ['ממוצע', n1(avg(W.map((w) => w.kg)))],
              ['טווח', <span dir="ltr">{n1(Math.min(...W.map((w) => w.kg)))}–{n1(Math.max(...W.map((w) => w.kg)))}</span>],
              ['שקילות', W.length],
            ]} />
            <div className="pdf-block mx-auto max-w-lg"><LineChart theme="light" digits={1} minPad={0.5} from={from} to={to} label="גרף משקל" series={[
              { label: 'שקילה', color: '#a1a1aa', points: W.map((w) => ({ date: w.date, v: w.kg })), width: 0.01 },
              { label: 'ממוצע 7 ימים', color: '#65a30d', points: rollingAverage(weights).filter(inRange).map((w) => ({ date: w.date, v: w.kg })), dots: false },
            ]} /></div>
            <Table head={['שבוע (מ-)', 'ממוצע', 'מינימום', 'מקסימום', 'שקילות']} rows={weightWeeks} />
          </Section>
        )}

        {show.glucose && G.length > 0 && (
          <Section title="סוכר בדם (mg/dL)">
            <Stats items={[
              ['ממוצע כללי', n0(avg(G.map((g) => g.value)))],
              ['מינימום', Math.min(...G.map((g) => g.value))],
              ['מקסימום', Math.max(...G.map((g) => g.value))],
              ['מדידות', G.length],
              ['ימים עם מדידה', sugarDays.length],
              ['ממוצע בצום', n0(avg(G.filter((g) => g.context === 'fasting').map((g) => g.value)))],
            ]} />
            <Table head={['מתי נמדד', 'מדידות', 'ממוצע', 'מינימום', 'מקסימום']} rows={byContext} />
            <div className="pdf-block mx-auto max-w-lg"><LineChart theme="light" minPad={5} from={from} to={to} label="גרף סוכר"
              series={sugarChart.length ? sugarChart : [{ label: 'ממוצע יומי', color: '#ea580c', points: sugarAllPts }]} /></div>
            <Table head={['תאריך', ...GLUCOSE_CONTEXTS.map((c) => c.label)]} rows={sugarDays} />
          </Section>
        )}

        {show.pressure && B.length > 0 && (
          <Section title="לחץ דם (mmHg)">
            <Stats items={[
              ['ממוצע', <span dir="ltr">{n0(avg(B.map((x) => x.sys)))}/{n0(avg(B.map((x) => x.dia)))}</span>],
              ['עליון: טווח', <span dir="ltr">{Math.min(...B.map((x) => x.sys))}–{Math.max(...B.map((x) => x.sys))}</span>],
              ['תחתון: טווח', <span dir="ltr">{Math.min(...B.map((x) => x.dia))}–{Math.max(...B.map((x) => x.dia))}</span>],
              ['דופק ממוצע', n0(avg(pulses))],
              ['מדידות', B.length],
              ['ימים עם מדידה', new Set(B.map((x) => x.date)).size],
            ]} />
            <div className="pdf-block mx-auto max-w-lg"><LineChart theme="light" minPad={5} from={from} to={to} label="גרף לחץ דם" series={[
              { label: 'עליון', color: '#0284c7', points: dailyAverages(B, (x) => x.sys).map((d) => ({ date: d.date, v: d.kg })) },
              { label: 'תחתון', color: '#7c3aed', points: dailyAverages(B, (x) => x.dia).map((d) => ({ date: d.date, v: d.kg })) },
            ]} /></div>
            <Table head={['תאריך', 'שעה', 'עליון/תחתון', 'דופק', 'הערה']} rows={B.map((x) => [
              fmtD(x.date), x.time, <span dir="ltr">{x.sys}/{x.dia}</span>, x.pulse ?? '', x.note ?? '',
            ])} />
          </Section>
        )}

        <footer className="mt-8 border-t border-zinc-300 pt-2 text-[10px] text-zinc-500">
          <p>המדידות הוזנו על ידי המשתמש באפליקציית "יומן כושר" ונועדו לתיעוד אישי. הדוח אינו מהווה אבחנה רפואית.</p>
          <Copyright className="mt-1 !text-start !text-zinc-400" />
        </footer>
      </article>
    </div>
  )
}
