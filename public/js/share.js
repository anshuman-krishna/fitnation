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

function frame(title, subtitle) {
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
  x.fillText(truncate(x, title, 936), 72, 292)
  x.fillStyle = muted
  x.font = `500 34px ${font}`
  x.fillText(truncate(x, subtitle, 936), 72, 352)

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

  return { c, x }
}

function tilerow(x, y, tiles) {
  const tw = (1080 - 72 * 2 - 24 * 2) / 3
  tiles.forEach(([label, value], i) => tile(x, 72 + (tw + 24) * i, y, tw, 180, label, value))
}

function ranked(x, y, heading, rows) {
  x.fillStyle = dim
  x.font = `700 28px ${font}`
  x.fillText(heading, 72, y)
  rows.forEach(([name, value], i) => {
    const ry = y + 70 + i * 84
    x.fillStyle = i === 0 ? volt : dim
    x.font = `800 34px ${font}`
    x.fillText(String(i + 1), 72, ry)
    x.fillStyle = text
    x.font = `600 38px ${font}`
    x.fillText(truncate(x, name, 640), 140, ry)
    x.fillStyle = volt
    x.font = `800 38px ${font}`
    x.fillText(value, 1008 - x.measureText(value).width, ry)
  })
}

function send(c, name, title) {
  c.toBlob(async blob => {
    if (!blob) return toast('could not render the card', 'error')
    const file = new File([blob], name, { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title })
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

export function sharecard(workout, sets) {
  const when = fmt.datetime(workout.started)
  const dur = workout.ended ? fmt.duration(workout.started, workout.ended) : ''
  const { c, x } = frame(workout.name, `${when}${dur ? ` · ${dur}` : ''}`)

  const volume = sets.reduce((s, r) => s + r.weight * r.reps, 0)
  const exercises = new Set(sets.map(s => s.exercise_id)).size
  tilerow(x, 430, [
    ['volume', `${fmt.num(showwt(volume))} ${wtunit()}`],
    ['sets', String(sets.length)],
    ['exercises', String(exercises)],
  ])

  const best = new Map()
  for (const s of sets) {
    const prev = best.get(s.exercise_id)
    const score = s.weight * (1 + s.reps / 30)
    if (!prev || score > prev.score) best.set(s.exercise_id, { ...s, score })
  }
  const top = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 5)
  if (top.length) {
    ranked(x, 730, 'top lifts', top.map(s => [
      s.exercise_name,
      s.weight > 0 ? `${showwt(s.weight)} ${wtunit()} × ${s.reps}` : `${s.reps} reps`,
    ]))
  }

  send(c, `fitnation-${(workout.started || '').slice(0, 10)}.png`, workout.name)
}

export function prcard(prs) {
  const today = new Date().toISOString().slice(0, 10)
  const { c, x } = frame('pr board', `all-time bests · ${fmt.date(today)}`)
  ranked(x, 470, 'by estimated 1rm', prs.slice(0, 8).map(p => [
    p.name,
    `${fmt.num1(showwt(p.est_1rm))} ${wtunit()}`,
  ]))
  send(c, `fitnation-prs-${today}.png`, 'pr board')
}

export function weekcard(report) {
  const today = new Date().toISOString().slice(0, 10)
  const { c, x } = frame('week in review', `last 7 days · ${fmt.date(today)}`)

  tilerow(x, 430, [
    ['workouts', String(report.this_week.workouts)],
    ['volume', `${fmt.num(showwt(report.this_week.volume))} ${wtunit()}`],
    ['sets', String(report.this_week.sets)],
  ])

  const dv = report.this_week.volume - report.last_week.volume
  const dw = report.this_week.workouts - report.last_week.workouts
  x.fillStyle = dim
  x.font = `700 28px ${font}`
  x.fillText('vs last week', 72, 730)
  x.font = `600 38px ${font}`
  const lines = [
    [`${dw >= 0 ? '▲' : '▼'} ${Math.abs(dw)} workout${Math.abs(dw) === 1 ? '' : 's'}`, dw >= 0],
    [`${dv >= 0 ? '▲' : '▼'} ${fmt.num(Math.abs(showwt(dv)))} ${wtunit()} volume`, dv >= 0],
  ]
  lines.forEach(([line, up], i) => {
    x.fillStyle = up ? volt : muted
    x.fillText(line, 72, 800 + i * 62)
  })

  const prs = report.prs_this_week || []
  x.fillStyle = dim
  x.font = `700 28px ${font}`
  x.fillText(prs.length ? `prs this week (${prs.length})` : 'prs this week', 72, 986)
  x.font = `600 36px ${font}`
  if (prs.length) {
    prs.slice(0, 3).forEach((p, i) => {
      x.fillStyle = text
      const line = `🏆 ${p.name} · ${fmt.num1(showwt(p.weight))} ${wtunit()}`
      x.fillText(truncate(x, line, 936), 72, 1050 + i * 58)
    })
  } else {
    x.fillStyle = muted
    x.fillText('none yet. next week is yours.', 72, 1050)
  }

  send(c, `fitnation-week-${today}.png`, 'week in review')
}
