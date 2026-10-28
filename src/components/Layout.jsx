import React from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CalendarDays, Dumbbell, House, Library, Scale, Timer } from 'lucide-react'
import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useNow } from '../hooks/useNow'
import { useAutoSync } from '../hooks/useAutoSync'
import { fmtClock } from '../lib/date'

const NAV = [
  { to: '/', label: 'בית', icon: House, end: true },
  { to: '/weight', label: 'משקל', icon: Scale },
  { to: '/workouts', label: 'אימונים', icon: Dumbbell },
  { to: '/exercises', label: 'תרגילים', icon: Library },
  { to: '/calendar', label: 'יומן', icon: CalendarDays },
]

function ActiveBanner() {
  const active = useStore((s) => s.active)
  const now = useNow(1000, !!active)
  if (!active) return null
  return (
    <Link
      to="/active"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md animate-pop items-center gap-3 rounded-2xl bg-lime-400 px-4 py-3 text-ink-950 shadow-[0_10px_30px_-10px_rgba(163,230,53,.7)]"
    >
      <Timer size={20} />
      <div className="flex-1 text-sm font-semibold">
        אימון פעיל · {active.programName}
      </div>
      <span className="tabular text-base font-bold">{fmtClock((now - active.startedAt) / 1000)}</span>
    </Link>
  )
}

export default function Layout() {
  useAutoSync()
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const hasActive = useStore((s) => !!s.active)

  return (
    <div className="min-h-dvh">
      <main className={`mx-auto w-full max-w-md ${hasActive ? 'pb-44' : 'pb-28'}`}>
        <Outlet />
      </main>
      <ActiveBanner />
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-ink-950/90 pb-safe backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${isActive ? 'text-lime-300' : 'text-zinc-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-7 w-12 place-items-center rounded-full transition ${isActive ? 'bg-lime-400/15' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
