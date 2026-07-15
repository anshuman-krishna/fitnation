export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v
    else if (k === 'html') node.innerHTML = v
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v)
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v)
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    node.append(child.nodeType ? child : document.createTextNode(child))
  }
  return node
}

export function toast(message, type = 'success') {
  const root = document.getElementById('toasts')
  const icons = { success: '✓', error: '✕', info: 'ℹ' }
  const node = el('div', { class: `toast ${type}` },
    el('span', { class: 'volt' }, icons[type] || ''),
    message)
  root.append(node)
  setTimeout(() => {
    node.classList.add('leaving')
    setTimeout(() => node.remove(), 300)
  }, 2800)
}

export function modal(content, { onclose } = {}) {
  const root = document.getElementById('modal-root')
  const box = el('div', { class: 'modal' })
  if (typeof content === 'function') content(box, close)
  else box.append(content)
  const overlay = el('div', { class: 'modal-overlay' }, box)
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })
  const esc = e => { if (e.key === 'Escape') close() }
  document.addEventListener('keydown', esc)
  function close() {
    overlay.remove()
    document.removeEventListener('keydown', esc)
    if (onclose) onclose()
  }
  root.append(overlay)
  return close
}

export function confirmdialog(message, onconfirm) {
  modal((box, close) => {
    box.append(
      el('h3', {}, 'are you sure?'),
      el('p', { class: 'muted' }, message),
      el('div', { class: 'modal-actions' },
        el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
        el('button', {
          class: 'btn danger', onclick: () => { close(); onconfirm() },
        }, 'delete')))
  })
}

export function spinner() {
  return el('div', { class: 'list' },
    el('div', { class: 'skeleton', style: 'height:64px' }),
    el('div', { class: 'skeleton', style: 'height:64px' }),
    el('div', { class: 'skeleton', style: 'height:64px' }))
}

export function empty(icon, message) {
  return el('div', { class: 'empty' },
    el('span', { class: 'ico' }, icon),
    el('p', {}, message))
}

export const fmt = {
  num: n => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(n || 0),
  num1: n => new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(n || 0),
  date: s => {
    if (!s) return ''
    const d = new Date(s.replace(' ', 'T'))
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  },
  datetime: s => {
    if (!s) return ''
    const d = new Date(s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z'))
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
  },
  ago: s => {
    if (!s) return ''
    const d = new Date(s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z'))
    const mins = Math.floor((Date.now() - d.getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
    return `${Math.floor(mins / 1440)}d ago`
  },
  duration: (start, end) => {
    if (!start || !end) return ''
    const ms = new Date(end.replace(' ', 'T') + 'Z') - new Date(start.replace(' ', 'T') + 'Z')
    const mins = Math.round(ms / 60000)
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  },
}

export function ring({ size = 84, stroke = 8, pct = 0, color = 'var(--volt)', big = '', small = '' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(pct, 1))
  const wrap = el('div', { style: `position:relative;width:${size}px;height:${size}px;flex-shrink:0` })
  wrap.innerHTML = `
    <svg class="ring" width="${size}" height="${size}">
      <circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="fill" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}"
        stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}"/>
    </svg>
    <div class="ring-label">
      <span class="big">${big}</span>
      <span class="small">${small}</span>
    </div>`
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrap.querySelector('.fill').style.strokeDashoffset = offset
    })
  })
  return wrap
}

export function macrobar(name, current, goal, color) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0
  const bar = el('div', { class: 'macro-row' },
    el('div', { class: 'mr-top' },
      el('span', { class: 'name' }, name),
      el('span', { class: 'nums', html: `<b>${fmt.num(current)}</b> / ${fmt.num(goal)}` })),
    el('div', { class: 'bar-track' },
      el('div', { class: 'bar-fill', style: `width:0;background:${color}` })))
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.querySelector('.bar-fill').style.width = `${pct * 100}%`
    })
  })
  return bar
}
