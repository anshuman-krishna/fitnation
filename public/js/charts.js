import { el } from './ui.js'

const ns = 'http://www.w3.org/2000/svg'

function svgel(tag, attrs = {}) {
  const node = document.createElementNS(ns, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

let tip = null
function showtip(x, y, html) {
  if (!tip) {
    tip = el('div', { class: 'chart-tip' })
    document.body.append(tip)
  }
  tip.innerHTML = html
  tip.style.left = `${Math.min(x + 14, innerWidth - 160)}px`
  tip.style.top = `${y - 40}px`
  tip.style.display = 'block'
}
function hidetip() {
  if (tip) tip.style.display = 'none'
}

export function linechart(points, { color = 'var(--volt)', height = 200, unit = '', fill = true, ylabel = v => v, avg = null } = {}) {
  const box = el('div', { class: 'chart-box' })
  if (!points.length) return box
  const w = 600
  const h = height
  const pad = { t: 14, r: 10, b: 26, l: 42 }

  const values = points.map(p => p.value)
  const max = Math.max(...values) * 1.12 || 1
  const min = Math.min(0, ...values)
  const span = max - min || 1

  const px = i => pad.l + (points.length === 1 ? (w - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (w - pad.l - pad.r))
  const py = v => pad.t + (1 - (v - min) / span) * (h - pad.t - pad.b)

  const svg = svgel('svg', { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'none', style: `height:${h}px` })
  const gid = `g${Math.random().toString(36).slice(2, 8)}`

  const defs = svgel('defs')
  defs.innerHTML = `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
  </linearGradient>`
  svg.append(defs)

  for (let g = 0; g <= 3; g++) {
    const y = pad.t + (g / 3) * (h - pad.t - pad.b)
    svg.append(svgel('line', { x1: pad.l, x2: w - pad.r, y1: y, y2: y, stroke: 'var(--border)', 'stroke-width': 1 }))
    const label = svgel('text', {
      x: pad.l - 8, y: y + 4, fill: 'var(--dim)', 'font-size': 10.5, 'text-anchor': 'end',
      'font-family': 'inherit',
    })
    label.textContent = ylabel(Math.round(max - (g / 3) * span))
    svg.append(label)
  }

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(p.value).toFixed(1)}`).join(' ')

  if (fill && points.length > 1) {
    svg.append(svgel('path', {
      d: `${line} L ${px(points.length - 1)} ${h - pad.b} L ${px(0)} ${h - pad.b} Z`,
      fill: `url(#${gid})`,
    }))
  }

  const path = svgel('path', {
    d: line, fill: 'none', stroke: color, 'stroke-width': 2.5,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  })
  svg.append(path)

  if (avg && avg.length === points.length && points.length > 1) {
    const d = avg.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')
    svg.append(svgel('path', {
      d, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.8,
      'stroke-dasharray': '5 5', opacity: 0.9,
    }))
  }

  points.forEach((p, i) => {
    const dot = svgel('circle', {
      cx: px(i), cy: py(p.value), r: points.length > 40 ? 2 : 3.5,
      fill: 'var(--surface)', stroke: color, 'stroke-width': 2,
    })
    dot.addEventListener('mousemove', e =>
      showtip(e.clientX, e.clientY, `<b>${p.value.toLocaleString()}${unit}</b> · ${p.label}`))
    dot.addEventListener('mouseleave', hidetip)
    svg.append(dot)
  })

  const step = Math.max(1, Math.ceil(points.length / 7))
  points.forEach((p, i) => {
    if (i % step !== 0 && i !== points.length - 1) return
    const label = svgel('text', {
      x: px(i), y: h - 8, fill: 'var(--dim)', 'font-size': 10.5, 'text-anchor': 'middle',
    })
    label.textContent = p.label
    svg.append(label)
  })

  box.append(svg)
  return box
}

export function barchart(points, { color = 'var(--sky)', height = 200, unit = '', avg = null } = {}) {
  const box = el('div', { class: 'chart-box' })
  if (!points.length) return box
  const w = 600
  const h = height
  const pad = { t: 14, r: 10, b: 26, l: 42 }
  const max = Math.max(...points.map(p => p.value)) * 1.12 || 1

  const svg = svgel('svg', { viewBox: `0 0 ${w} ${h}`, style: `height:${h}px` })

  for (let g = 0; g <= 3; g++) {
    const y = pad.t + (g / 3) * (h - pad.t - pad.b)
    svg.append(svgel('line', { x1: pad.l, x2: w - pad.r, y1: y, y2: y, stroke: 'var(--border)', 'stroke-width': 1 }))
    const label = svgel('text', { x: pad.l - 8, y: y + 4, fill: 'var(--dim)', 'font-size': 10.5, 'text-anchor': 'end' })
    label.textContent = Math.round(max - (g / 3) * max).toLocaleString()
    svg.append(label)
  }

  const bw = Math.min(34, ((w - pad.l - pad.r) / points.length) * 0.62)
  points.forEach((p, i) => {
    const x = pad.l + ((i + 0.5) / points.length) * (w - pad.l - pad.r) - bw / 2
    const bh = (p.value / max) * (h - pad.t - pad.b)
    const bar = svgel('rect', {
      x, y: h - pad.b - bh, width: bw, height: Math.max(bh, 1), rx: 5,
      fill: p.highlight ? 'var(--volt)' : color, opacity: 0.9,
    })
    bar.addEventListener('mousemove', e =>
      showtip(e.clientX, e.clientY, `<b>${p.value.toLocaleString()}${unit}</b> · ${p.label}`))
    bar.addEventListener('mouseleave', hidetip)
    svg.append(bar)
  })

  if (avg && avg.length === points.length && points.length > 1) {
    const ax = i => pad.l + ((i + 0.5) / points.length) * (w - pad.l - pad.r)
    const ay = v => pad.t + (1 - v / max) * (h - pad.t - pad.b)
    const d = avg.map((v, i) => `${i === 0 ? 'M' : 'L'} ${ax(i).toFixed(1)} ${ay(v).toFixed(1)}`).join(' ')
    svg.append(svgel('path', {
      d, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.8,
      'stroke-dasharray': '5 5', opacity: 0.9,
    }))
  }

  const step = Math.max(1, Math.ceil(points.length / 8))
  points.forEach((p, i) => {
    if (i % step !== 0) return
    const label = svgel('text', {
      x: pad.l + ((i + 0.5) / points.length) * (w - pad.l - pad.r),
      y: h - 8, fill: 'var(--dim)', 'font-size': 10.5, 'text-anchor': 'middle',
    })
    label.textContent = p.label
    svg.append(label)
  })

  box.append(svg)
  return box
}

export function heatmap(rows, { unit = '' } = {}) {
  const box = el('div', { class: 'chart-box', style: 'overflow-x:auto' })
  const byday = new Map(rows.map(r => [r.date, r]))
  const cell = 11
  const gap = 3
  const step = cell + gap
  const top = 18

  const today = new Date()
  const start = new Date(today.getTime() - 363 * 86400000)
  while (start.getUTCDay() !== 1) start.setUTCDate(start.getUTCDate() - 1)
  const days = []
  for (const d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) days.push(new Date(d))

  const vols = rows.filter(r => r.volume > 0).map(r => r.volume).sort((a, b) => a - b)
  const q = p => vols.length ? vols[Math.min(vols.length - 1, Math.floor(p * vols.length))] : 0
  const t = [q(0.25), q(0.5), q(0.75)]
  const level = v => v <= 0 ? 0 : v <= t[0] ? 1 : v <= t[1] ? 2 : v <= t[2] ? 3 : 4
  const opacity = [0, 0.22, 0.45, 0.7, 1]

  const cols = Math.ceil(days.length / 7)
  const w = cols * step - gap
  const h = top + 7 * step - gap
  const svg = svgel('svg', { viewBox: `0 0 ${w} ${h}`, style: 'width:100%;min-width:560px;height:auto' })

  let lastmonth = -1
  days.forEach((d, i) => {
    const col = Math.floor(i / 7)
    const row = (d.getUTCDay() + 6) % 7
    const iso = d.toISOString().slice(0, 10)
    const entry = byday.get(iso)
    const v = entry ? entry.volume : 0
    const lv = entry && entry.workouts > 0 ? Math.max(1, level(v)) : level(v)
    const rect = svgel('rect', {
      x: col * step, y: top + row * step, width: cell, height: cell, rx: 3,
      fill: lv === 0 ? 'var(--border)' : 'var(--volt)',
      'fill-opacity': lv === 0 ? 0.55 : opacity[lv],
    })
    rect.addEventListener('mousemove', e => {
      const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
      showtip(e.clientX, e.clientY, entry
        ? `<b>${v.toLocaleString()}${unit}</b> · ${entry.workouts} workout${entry.workouts === 1 ? '' : 's'} · ${label}`
        : `<b>rest day</b> · ${label}`)
    })
    rect.addEventListener('mouseleave', hidetip)
    svg.append(rect)

    if (row === 0 && d.getUTCMonth() !== lastmonth) {
      if (lastmonth !== -1) {
        const label = svgel('text', { x: col * step, y: 11, fill: 'var(--dim)', 'font-size': 10 })
        label.textContent = d.toLocaleDateString('en', { month: 'short' }).toLowerCase()
        svg.append(label)
      }
      lastmonth = d.getUTCMonth()
    }
  })

  box.append(svg)
  return box
}

export function donut(slices, { size = 170, hole = 0.66 } = {}) {
  const box = el('div', { class: 'chart-box', style: `max-width:${size}px;margin:0 auto` })
  const total = slices.reduce((s, x) => s + x.value, 0)
  if (!total) return box
  const svg = svgel('svg', { viewBox: '0 0 100 100', style: `height:${size}px` })
  const r = 40
  const c = 2 * Math.PI * r
  let acc = 0
  for (const s of slices) {
    const frac = s.value / total
    const arc = svgel('circle', {
      cx: 50, cy: 50, r, fill: 'none', stroke: s.color,
      'stroke-width': (1 - hole) * 55,
      'stroke-dasharray': `${(frac * c).toFixed(2)} ${c.toFixed(2)}`,
      'stroke-dashoffset': (-acc * c).toFixed(2),
      transform: 'rotate(-90 50 50)',
    })
    arc.addEventListener('mousemove', e =>
      showtip(e.clientX, e.clientY, `<b>${s.label}</b> · ${Math.round(frac * 100)}%`))
    arc.addEventListener('mouseleave', hidetip)
    svg.append(arc)
    acc += frac
  }
  box.append(svg)
  return box
}
