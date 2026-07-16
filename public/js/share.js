import { fmt, toast } from './ui.js'
import { showwt, wtunit } from './units.js'

const bg = '#0a0b0d'
const volt = '#c9f24b'
const text = '#f2f4f7'
const muted = 'rgba(242,244,247,0.55)'
const dim = 'rgba(242,244,247,0.32)'
const surface = 'rgba(255,255,255,0.05)'
const border = 'rgba(255,255,255,0.09)'
const font = 'system-ui, -apple-system, sans-serif'

function truncate(x, s, max) {
  if (x.measureText(s).width <= max) return s
  while (s.length && x.measureText(s + '…').width > max) s = s.slice(0, -1)
  return s + '…'
}

function orb(x, cx, cy, r, color) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = g
  x.fillRect(cx - r, cy - r, r * 2, r * 2)
}

function tile(x, tx, ty, tw, th, label, value) {
  x.fillStyle = surface
  x.strokeStyle = border
  x.lineWidth = 2
  x.beginPath()
  x.roundRect(tx, ty, tw, th, 28)
  x.fill()
  x.stroke()
  x.fillStyle = muted
  x.font = `600 26px ${font}`
  x.fillText(label, tx + 36, ty + 66)
  x.fillStyle = text
  x.font = `800 56px ${font}`
  x.fillText(truncate(x, value, tw - 72), tx + 36, ty + 138)
}

export function sharecard(workout, sets) {
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1350
  const x = c.getContext('2d')
  x.textBaseline = 'alphabetic'

  x.fillStyle = bg
  x.fillRect(0, 0, c.width, c.height)
  orb(x, 980, 60, 460, 'rgba(201,242,75,0.14)')
  orb(x, 60, 1290, 420, 'rgba(86,184,255,0.10)')

  x.fillStyle = volt
  x.font = `700 44px ${font}`
  x.fillText('⚡', 72, 118)
  x.fillStyle = text
  x.font = `800 44px ${font}`
  x.fillText('fitnation', 130, 118)

  x.fillStyle = text
  x.font = `800 88px ${font}`
  x.fillText(truncate(x, workout.name, 936), 72, 292)
  x.fillStyle = muted
  x.font = `500 34px ${font}`
  const when = fmt.datetime(workout.started)
  const dur = workout.ended ? fmt.duration(workout.started, workout.ended) : ''
  x.fillText(`${when}${dur ? ` · ${dur}` : ''}`, 72, 352)

  const volume = sets.reduce((s, r) => s + r.weight * r.reps, 0)
  const exercises = new Set(sets.map(s => s.exercise_id)).size
  const tw = (1080 - 72 * 2 - 24 * 2) / 3
  tile(x, 72, 430, tw, 180, 'volume', `${fmt.num(showwt(volume))} ${wtunit()}`)
  tile(x, 72 + tw + 24, 430, tw, 180, 'sets', String(sets.length))
  tile(x, 72 + (tw + 24) * 2, 430, tw, 180, 'exercises', String(exercises))

  const best = new Map()
  for (const s of sets) {
    const prev = best.get(s.exercise_id)
    const score = s.weight * (1 + s.reps / 30)
    if (!prev || score > prev.score) best.set(s.exercise_id, { ...s, score })
  }
  const top = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 5)

  if (top.length) {
    x.fillStyle = dim
    x.font = `700 28px ${font}`
    x.fillText('top lifts', 72, 730)
    top.forEach((s, i) => {
      const y = 800 + i * 84
      x.fillStyle = i === 0 ? volt : dim
      x.font = `800 34px ${font}`
      x.fillText(String(i + 1), 72, y)
      x.fillStyle = text
      x.font = `600 38px ${font}`
      x.fillText(truncate(x, s.exercise_name, 640), 140, y)
      const val = s.weight > 0 ? `${showwt(s.weight)} ${wtunit()} × ${s.reps}` : `${s.reps} reps`
      x.fillStyle = volt
      x.font = `800 38px ${font}`
      x.fillText(val, 1008 - x.measureText(val).width, y)
    })
  }

  x.strokeStyle = border
  x.beginPath()
  x.moveTo(72, 1250)
  x.lineTo(1008, 1250)
  x.stroke()
  x.fillStyle = muted
  x.font = `600 28px ${font}`
  x.fillText('logged with fitnation', 72, 1302)
  x.fillStyle = volt
  x.font = `700 28px ${font}`
  const mark = 'no fluff. just lifts.'
  x.fillText(mark, 1008 - x.measureText(mark).width, 1302)

  const name = `fitnation-${(workout.started || '').slice(0, 10)}.png`
  c.toBlob(async blob => {
    if (!blob) return toast('could not render the card', 'error')
    const file = new File([blob], name, { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: workout.name })
        return
      } catch {}
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
    toast('share card saved')
  })
}
