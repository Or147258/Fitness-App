import React from 'react'
import { useState } from 'react'
import { Dumbbell, Play } from 'lucide-react'
import { muscleById } from '../data/exercises'
import { detectMediaType, parseYouTube } from '../lib/media'

function Placeholder({ exercise, small }) {
  const m = muscleById(exercise?.muscle)
  return (
    <div className={`grid h-full w-full place-items-center bg-gradient-to-br ${m.grad} to-ink-800`}>
      <div className="flex flex-col items-center gap-1 text-white/70">
        <Dumbbell size={small ? 18 : 34} />
        {!small && <span className="text-xs">אין עדיין תמונה או סרטון</span>}
      </div>
    </div>
  )
}

/** תצוגה מלאה: תמונה / GIF / וידאו / יוטיוב */
export function ExerciseMedia({ exercise, className = '' }) {
  const [failed, setFailed] = useState(false)
  const url = exercise?.mediaUrl
  const type = exercise?.mediaType || detectMediaType(url)
  let content
  if (!url || failed) content = <Placeholder exercise={exercise} />
  else if (type === 'youtube')
    content = (
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${parseYouTube(url)}?rel=0&playsinline=1`}
        title={exercise.name}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  else if (type === 'video')
    content = <video className="h-full w-full object-cover" src={url} autoPlay muted loop playsInline onError={() => setFailed(true)} />
  else content = <img className="h-full w-full object-cover" src={url} alt={exercise.name} onError={() => setFailed(true)} />
  return <div className={`aspect-video overflow-hidden rounded-2xl bg-ink-800 ${className}`}>{content}</div>
}

/** תמונה ממוזערת לרשימות */
export function ExerciseThumb({ exercise, size = 'size-12' }) {
  const [failed, setFailed] = useState(false)
  const url = exercise?.mediaUrl
  const type = exercise?.mediaType || detectMediaType(url)
  let content
  if (!url || failed) content = <Placeholder exercise={exercise} small />
  else if (type === 'youtube')
    content = (
      <div className="relative h-full w-full">
        <img className="h-full w-full object-cover" src={`https://i.ytimg.com/vi/${parseYouTube(url)}/mqdefault.jpg`} alt="" onError={() => setFailed(true)} />
        <Play size={14} className="absolute inset-0 m-auto fill-white text-white" />
      </div>
    )
  else if (type === 'video') content = <video className="h-full w-full object-cover" src={url} muted playsInline preload="metadata" />
  else content = <img className="h-full w-full object-cover" src={url} alt="" loading="lazy" onError={() => setFailed(true)} />
  return <div className={`${size} shrink-0 overflow-hidden rounded-xl bg-ink-800`}>{content}</div>
}
