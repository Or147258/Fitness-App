import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Utensils } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageHeader, Sheet, ConfirmSheet, Segmented, toast } from '../components/ui'
import { uid } from '../lib/ids'
import { BASIC_FOODS, fmtKcal, itemKcal, mealKcal, menuTotal } from '../lib/nutrition'

const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}
const unitLabel = (it) => (it.unit === 'g' ? `${it.qty} גרם` : it.qty === 1 ? 'יחידה' : `${it.qty} יחידות`)
const COLORS = ['bg-lime-400', 'bg-sky-400', 'bg-orange-400', 'bg-violet-400', 'bg-rose-400', 'bg-teal-400', 'bg-amber-400']

/* ---------- הוספה / עריכה של מוצר ---------- */
function ItemSheet({ open, onClose, item, suggestions, onSave, onDelete }) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('unit')
  const [qty, setQty] = useState('1')
  const [kcal, setKcal] = useState('')
  const [picked, setPicked] = useState(null)

  React.useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setUnit(item?.unit ?? 'unit')
    setQty(item ? String(item.qty) : '1')
    setKcal(item ? String(item.kcal) : '')
    setPicked(null)
  }, [open, item])

  const q = name.trim().toLowerCase()
  const matches = q && !item && picked !== name ? suggestions.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 5) : []
  const pick = (s) => {
    setPicked(s.name)
    setName(s.name)
    setUnit(s.unit)
    setKcal(String(s.kcal))
    setQty(s.unit === 'g' ? '100' : '1')
  }
  const preview = itemKcal({ unit, qty: num(qty) || 0, kcal: num(kcal) || 0 })

  const save = (e) => {
    e.preventDefault()
    const Q = num(qty)
    const K = num(kcal)
    if (!name.trim()) return toast('צריך שם למוצר')
    if (!(Q > 0)) return toast('הזן כמות')
    if (!(K >= 0)) return toast('הזן קלוריות')
    onSave({ id: item?.id ?? uid(), name: name.trim(), unit, qty: Q, kcal: K })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={item ? 'עריכת מוצר' : 'הוספת מוצר'}>
      <form onSubmit={save} className="space-y-4">
        <div className="relative">
          <label className="label">שם המוצר</label>
          <input className="input" autoFocus={!item} placeholder="למשל: ביצה, אורז, יוגורט" aria-label="שם המוצר" value={name} onChange={(e) => setName(e.target.value)} />
          {matches.length > 0 && (
            <ul className="mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-ink-800">
              {matches.map((s) => (
                <li key={s.name}>
                  <button type="button" onClick={() => pick(s)} className="flex w-full items-center justify-between px-3 py-2.5 text-start text-sm active:bg-white/5">
                    <span>{s.name}</span>
                    <span className="text-xs text-zinc-500">{s.kcal} קק״ל {s.unit === 'g' ? 'ל-100 גרם' : 'ליחידה'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="label">איך מודדים?</label>
          <Segmented value={unit} onChange={(u) => { setUnit(u); if (u === 'g' && qty === '1') setQty('100'); if (u === 'unit' && qty === '100') setQty('1') }}
            options={[{ value: 'unit', label: 'ביחידות' }, { value: 'g', label: 'בגרמים' }]} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">{unit === 'g' ? 'כמות (גרם)' : 'כמות (יחידות)'}</label>
            <input className="input tabular text-center font-semibold" inputMode="decimal" aria-label="כמות" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <label className="label">{unit === 'g' ? 'קלוריות ל-100 גרם' : 'קלוריות ליחידה'}</label>
            <input className="input tabular text-center font-semibold" inputMode="decimal" placeholder="0" aria-label="קלוריות" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          </div>
        </div>
        {unit === 'g' && <p className="-mt-2 text-xs text-zinc-500">את הקלוריות ל-100 גרם רואים בטבלת הערכים התזונתיים על האריזה.</p>}

        <div className="flex items-center justify-between rounded-xl bg-ink-800 px-4 py-3">
          <span className="text-sm text-zinc-400">סה״כ למוצר</span>
          <span className="tabular text-xl font-bold text-lime-300">{fmtKcal(preview)} <span className="text-xs font-normal text-zinc-500">קק״ל</span></span>
        </div>

        <button className="btn-primary w-full">{item ? 'שמור' : 'הוסף לארוחה'}</button>
        {item && <button type="button" className="btn-danger w-full" onClick={() => { onDelete(item.id); onClose() }}><Trash2 size={16} /> הסר מהארוחה</button>}
      </form>
    </Sheet>
  )
}

/* ---------- שם ארוחה ---------- */
function MealNameSheet({ open, onClose, meal, onSave }) {
  const [name, setName] = useState('')
  React.useEffect(() => { if (open) setName(meal?.name ?? '') }, [open, meal])
  return (
    <Sheet open={open} onClose={onClose} title={meal ? 'שינוי שם הארוחה' : 'ארוחה חדשה'}>
      <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; onSave(name.trim()); onClose() }} className="space-y-4">
        <input className="input" autoFocus placeholder="למשל: לפני אימון, ארוחת לילה" aria-label="שם הארוחה" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {['לפני אימון', 'אחרי אימון', 'ביניים 2', 'ארוחת לילה'].map((s) => (
            <button key={s} type="button" onClick={() => setName(s)} className="h-8 rounded-full bg-white/[0.06] px-3 text-xs text-zinc-300">{s}</button>
          ))}
        </div>
        <button className="btn-primary w-full" disabled={!name.trim()}>{meal ? 'שמור' : 'הוסף ארוחה'}</button>
      </form>
    </Sheet>
  )
}

export default function Nutrition() {
  const menu = useStore((s) => s.menu)
  const updateMenu = useStore((s) => s.updateMenu)
  const [itemSheet, setItemSheet] = useState(null) // { mealId, item }
  const [nameSheet, setNameSheet] = useState(null) // { meal } | { meal: null }
  const [toDelete, setToDelete] = useState(null)

  const total = menuTotal(menu)
  const suggestions = useMemo(() => {
    const mine = menu.meals.flatMap((m) => m.items)
    const seen = new Set()
    return [...mine, ...BASIC_FOODS].filter((s) => (seen.has(s.name) ? false : seen.add(s.name)))
  }, [menu])

  const setMeals = (fn) => updateMenu((m) => ({ ...m, meals: fn(m.meals) }))
  const saveItem = (mealId, it) =>
    setMeals((meals) => meals.map((m) => (m.id !== mealId ? m : { ...m, items: m.items.some((x) => x.id === it.id) ? m.items.map((x) => (x.id === it.id ? it : x)) : [...m.items, it] })))
  const deleteItem = (mealId, id) => setMeals((meals) => meals.map((m) => (m.id !== mealId ? m : { ...m, items: m.items.filter((x) => x.id !== id) })))
  const moveMeal = (i, d) => setMeals((meals) => { const j = i + d; if (j < 0 || j >= meals.length) return meals; const n = [...meals]; [n[i], n[j]] = [n[j], n[i]]; return n })

  return (
    <>
      <PageHeader title="התפריט שלי" subtitle="תפריט יומי קבוע — אפשר לשנות בכל רגע" />
      <div className="space-y-4 px-4">
        {/* סיכום */}
        <section className="card p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-zinc-400">סה״כ ביום</div>
              <div className="tabular text-4xl font-extrabold">{fmtKcal(total)} <span className="text-base font-medium text-zinc-500">קק״ל</span></div>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-lime-400/10 text-lime-300"><Utensils /></span>
          </div>
          {total > 0 && (
            <>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink-700">
                {menu.meals.map((m, i) => {
                  const k = mealKcal(m)
                  return k > 0 ? <div key={m.id} className={COLORS[i % COLORS.length]} style={{ width: `${(k / total) * 100}%` }} title={m.name} /> : null
                })}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {menu.meals.map((m, i) => {
                  const k = mealKcal(m)
                  return (
                    <li key={m.id} className="flex items-center gap-2">
                      <span className={`size-2.5 shrink-0 rounded-full ${COLORS[i % COLORS.length]}`} />
                      <span className="flex-1 truncate text-zinc-300">{m.name}</span>
                      <span className="tabular text-zinc-400">{fmtKcal(k)}</span>
                      <span className="tabular w-9 text-start text-xs text-zinc-600">{Math.round((k / total) * 100)}%</span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>

        {/* ארוחות */}
        {menu.meals.map((meal, i) => (
          <section key={meal.id} className="card overflow-hidden">
            <header className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <span className={`size-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
              <h2 className="flex-1 truncate text-base font-bold">{meal.name}</h2>
              <span className="tabular text-sm font-semibold text-zinc-300">{fmtKcal(mealKcal(meal))} <span className="text-xs font-normal text-zinc-500">קק״ל</span></span>
              <div className="flex">
                <button className="p-1.5 text-zinc-500 disabled:opacity-20" disabled={i === 0} onClick={() => moveMeal(i, -1)} aria-label="הזז למעלה"><ChevronUp size={17} /></button>
                <button className="p-1.5 text-zinc-500 disabled:opacity-20" disabled={i === menu.meals.length - 1} onClick={() => moveMeal(i, 1)} aria-label="הזז למטה"><ChevronDown size={17} /></button>
                <button className="p-1.5 text-zinc-500" onClick={() => setNameSheet({ meal })} aria-label="שינוי שם"><Pencil size={15} /></button>
                <button className="p-1.5 text-zinc-500 active:text-rose-300" onClick={() => setToDelete(meal)} aria-label="מחיקת ארוחה"><Trash2 size={15} /></button>
              </div>
            </header>
            {meal.items.length > 0 && (
              <ul className="divide-y divide-white/5">
                {meal.items.map((it) => (
                  <li key={it.id}>
                    <button className="flex w-full items-center gap-3 px-4 py-2.5 text-start active:bg-white/5" onClick={() => setItemSheet({ mealId: meal.id, item: it })}>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{it.name}</div>
                        <div className="text-xs text-zinc-500">{unitLabel(it)}</div>
                      </div>
                      <span className="tabular text-sm font-semibold">{fmtKcal(itemKcal(it))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-lime-300 active:bg-white/5" onClick={() => setItemSheet({ mealId: meal.id, item: null })}>
              <Plus size={16} /> הוסף מוצר
            </button>
          </section>
        ))}

        <button className="btn-ghost h-12 w-full border border-dashed border-white/15" onClick={() => setNameSheet({ meal: null })}>
          <Plus size={18} /> הוסף ארוחה
        </button>
        <p className="px-2 text-center text-[11px] leading-relaxed text-zinc-600">
          ערכי המוצרים המוצעים משוערים. לדיוק — העתיקו את הקלוריות מהאריזה.
        </p>
      </div>

      <ItemSheet
        open={!!itemSheet}
        onClose={() => setItemSheet(null)}
        item={itemSheet?.item}
        suggestions={suggestions}
        onSave={(it) => { saveItem(itemSheet.mealId, it); toast(itemSheet.item ? 'עודכן' : 'נוסף לארוחה') }}
        onDelete={(id) => deleteItem(itemSheet.mealId, id)}
      />
      <MealNameSheet
        open={!!nameSheet}
        onClose={() => setNameSheet(null)}
        meal={nameSheet?.meal}
        onSave={(name) => nameSheet.meal
          ? setMeals((meals) => meals.map((m) => (m.id === nameSheet.meal.id ? { ...m, name } : m)))
          : setMeals((meals) => [...meals, { id: uid(), name, items: [] }])}
      />
      <ConfirmSheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={`למחוק את "${toDelete?.name}"?`}
        message={toDelete?.items.length ? `הארוחה וכל ${toDelete.items.length} המוצרים שבה יימחקו.` : undefined}
        confirmText="מחק"
        danger
        onConfirm={() => setMeals((meals) => meals.filter((m) => m.id !== toDelete.id))}
      />
    </>
  )
}
