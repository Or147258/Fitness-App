import React from 'react'

export const COPYRIGHT_OWNER = 'Or Chen'
const START_YEAR = 2026

/** הודעת זכויות יוצרים: © 2026 Or Chen (או 2026–2027 בשנים הבאות) */
export function Copyright({ className = '' }) {
  const year = new Date().getFullYear()
  const years = year > START_YEAR ? `${START_YEAR}–${year}` : `${START_YEAR}`
  return (
    <p className={`text-center text-[11px] text-zinc-600 ${className}`}>
      <span dir="ltr">© {years} {COPYRIGHT_OWNER}</span> · כל הזכויות שמורות
    </p>
  )
}
