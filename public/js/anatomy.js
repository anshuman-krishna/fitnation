import { el } from './ui.js'

const shapes = [
  ['head', 'f', 'circle', { cx: 60, cy: 18, r: 10 }],
  ['neck', 'f', 'rect', { x: 55, y: 27, width: 10, height: 8, rx: 3 }],
  ['shoulders', 'f', 'rect', { x: 32, y: 36, width: 56, height: 11, rx: 5.5 }],
  ['chest', 'f', 'rect', { x: 41, y: 48, width: 38, height: 19, rx: 7 }],
  ['core', 'f', 'rect', { x: 46, y: 69, width: 28, height: 32, rx: 7 }],
  ['biceps', 'f', 'rect', { x: 24, y: 48, width: 10, height: 25, rx: 5 }],
  ['biceps', 'f', 'rect', { x: 86, y: 48, width: 10, height: 25, rx: 5 }],
  ['forearm', 'f', 'rect', { x: 22, y: 76, width: 9, height: 26, rx: 4.5 }],
  ['forearm', 'f', 'rect', { x: 89, y: 76, width: 9, height: 26, rx: 4.5 }],
  ['hips', 'f', 'rect', { x: 44, y: 103, width: 32, height: 12, rx: 5 }],
  ['quads', 'f', 'rect', { x: 43, y: 117, width: 15, height: 42, rx: 7 }],
  ['quads', 'f', 'rect', { x: 62, y: 117, width: 15, height: 42, rx: 7 }],
  ['shin', 'f', 'rect', { x: 45, y: 162, width: 12, height: 34, rx: 6 }],
  ['shin', 'f', 'rect', { x: 63, y: 162, width: 12, height: 34, rx: 6 }],

  ['head', 'b', 'circle', { cx: 60, cy: 18, r: 10 }],
  ['traps', 'b', 'rect', { x: 46, y: 28, width: 28, height: 12, rx: 5 }],
  ['shoulders', 'b', 'rect', { x: 32, y: 36, width: 56, height: 11, rx: 5.5 }],
  ['lats', 'b', 'rect', { x: 40, y: 48, width: 13, height: 30, rx: 6 }],
  ['lats', 'b', 'rect', { x: 67, y: 48, width: 13, height: 30, rx: 6 }],
  ['midback', 'b', 'rect', { x: 54, y: 48, width: 12, height: 26, rx: 5 }],
  ['lowerback', 'b', 'rect', { x: 49, y: 80, width: 22, height: 15, rx: 6 }],
  ['triceps', 'b', 'rect', { x: 24, y: 48, width: 10, height: 25, rx: 5 }],
  ['triceps', 'b', 'rect', { x: 86, y: 48, width: 10, height: 25, rx: 5 }],
  ['forearm', 'b', 'rect', { x: 22, y: 76, width: 9, height: 26, rx: 4.5 }],
  ['forearm', 'b', 'rect', { x: 89, y: 76, width: 9, height: 26, rx: 4.5 }],
  ['glutes', 'b', 'rect', { x: 44, y: 98, width: 32, height: 17, rx: 8 }],
  ['hamstrings', 'b', 'rect', { x: 43, y: 118, width: 15, height: 40, rx: 7 }],
  ['hamstrings', 'b', 'rect', { x: 62, y: 118, width: 15, height: 40, rx: 7 }],
  ['calves', 'b', 'rect', { x: 45, y: 161, width: 12, height: 32, rx: 6 }],
  ['calves', 'b', 'rect', { x: 63, y: 161, width: 12, height: 32, rx: 6 }],
]

const regions = {
  chest: ['chest'],
  shoulders: ['shoulders'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  back: ['traps', 'lats', 'midback'],
  lats: ['lats'],
  'lower back': ['lowerback'],
  core: ['core'],
  quads: ['quads'],
  legs: ['quads', 'hamstrings', 'glutes'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
}

const everything = [...new Set(shapes.map(s => s[0]))].filter(r => r !== 'head')

export function anatomy(muscle, { height = 150 } = {}) {
  const active = regions[muscle] || everything
  const full = !regions[muscle]

  const fig = side => shapes
    .filter(s => s[1] === side)
    .map(([region, , tag, attrs]) => {
      const hit = active.includes(region)
      const fill = hit ? 'var(--volt)' : 'var(--surface2)'
      const opacity = hit ? (full ? 0.45 : 0.95) : 1
      const a = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')
      return `<${tag} ${a} fill="${fill}" opacity="${opacity}"/>`
    }).join('')

  const box = el('div', { class: 'anatomy', style: 'display:flex;gap:6px;justify-content:center' })
  box.innerHTML = `
    <svg viewBox="14 4 92 196" style="height:${height}px" aria-label="front">${fig('f')}</svg>
    <svg viewBox="14 4 92 196" style="height:${height}px" aria-label="back">${fig('b')}</svg>`
  return box
}
