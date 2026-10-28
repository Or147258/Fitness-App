import React from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { ChevronRight, Minus, Plus, X } from 'lucide-react'

export function PageHeader({ title, subtitle, action, back = false }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 bg-ink-950/85 pt-safe backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4">
        {back && (
          <button onClick={() => navigate(-1)} className="btn-icon rounded-full" aria-label="חזרה">
            <ChevronRight size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-bold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-zinc-400">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}

export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-black/70" onClick={onClose} />
      <div className="relative flex max-h-[90dvh] w-full max-w-md animate-sheet flex-col rounded-t-3xl border-t border-white/10 bg-ink-900 pb-safe">
        <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/15" />
        <div className="flex items-center gap-2 px-5 pb-3 pt-5">
          <h2 className="flex-1 text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="סגור" className="grid size-9 place-items-center rounded-full bg-white/[0.06]">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-white/5 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmSheet({ open, onClose, title, message, confirmText = 'אישור', danger = false, onConfirm }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {message && <p className="mb-5 text-sm leading-relaxed text-zinc-300">{message}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-ghost h-12" onClick={onClose}>ביטול</button>
        <button
          className={danger ? 'btn h-12 bg-rose-500 text-white' : 'btn-primary'}
          onClick={() => { onConfirm(); onClose() }}
        >
          {confirmText}
        </button>
      </div>
    </Sheet>
  )
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, format = (v) => v }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="flex h-11 items-center overflow-hidden rounded-xl border border-white/10 bg-ink-800">
      <button type="button" className="grid h-full w-11 place-items-center text-zinc-300 active:bg-white/10" onClick={() => set(value + step)} aria-label="הוסף">
        <Plus size={18} />
      </button>
      <span className="tabular min-w-[3.5rem] flex-1 text-center font-semibold">{format(value)}</span>
      <button type="button" className="grid h-full w-11 place-items-center text-zinc-300 active:bg-white/10" onClick={() => set(value - step)} aria-label="הפחת">
        <Minus size={18} />
      </button>
    </div>
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex rounded-xl bg-ink-800 p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`h-9 flex-1 rounded-lg text-sm font-medium transition ${value === o.value ? 'bg-ink-600 text-white shadow' : 'text-zinc-400'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-zinc-500">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-lime-400' : 'bg-ink-600'}`}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${checked ? 'start-6' : 'start-1'}`} />
      </button>
    </label>
  )
}

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      {Icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-lime-400/10 text-lime-300">
          <Icon size={26} />
        </div>
      )}
      <h3 className="text-base font-bold">{title}</h3>
      {text && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-zinc-400">{text}</p>}
      {children && <div className="mt-5 w-full">{children}</div>}
    </div>
  )
}

/* ---------- Toast ---------- */
const useToastStore = create(() => ({ msg: null, key: 0 }))
let toastTimer
export function toast(msg) {
  clearTimeout(toastTimer)
  useToastStore.setState((s) => ({ msg, key: s.key + 1 }))
  toastTimer = setTimeout(() => useToastStore.setState({ msg: null }), 2400)
}
export function Toaster() {
  const { msg, key } = useToastStore()
  if (!msg) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-safe">
      <div key={key} className="mt-3 animate-pop rounded-full border border-white/10 bg-ink-700/95 px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur">
        {msg}
      </div>
    </div>
  )
}
