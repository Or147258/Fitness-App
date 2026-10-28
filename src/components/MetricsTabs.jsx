import React from 'react'
import { NavLink } from 'react-router-dom'
import { Droplet, HeartPulse, Scale } from 'lucide-react'

/** מעבר בין מעקב משקל למעקב סוכר */
export function MetricsTabs() {
  const tab = ({ isActive }) =>
    `flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition ${
      isActive ? 'bg-ink-600 text-white shadow' : 'text-zinc-400'
    }`
  return (
    <div className="mx-4 mb-4 flex rounded-xl bg-ink-800 p-1">
      <NavLink to="/weight" className={tab}>
        <Scale size={16} /> משקל
      </NavLink>
      <NavLink to="/sugar" className={tab}>
        <Droplet size={16} /> סוכר
      </NavLink>
      <NavLink to="/pressure" className={tab}>
        <HeartPulse size={16} /> לחץ דם
      </NavLink>
    </div>
  )
}
