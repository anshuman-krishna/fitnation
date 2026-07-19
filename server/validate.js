function text(v, max) {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t && t.length <= max ? t : undefined
}

function optext(v, max, fallback) {
  const t = typeof v === 'string' ? v.trim() : ''
  if (!t) return fallback
  return t.length <= max ? t : undefined
}

function num(v, min, max) {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return undefined
  const n = +v
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined
}

function optnum(v, min, max, fallback) {
  if (v === undefined || v === null || v === '') return fallback
  return num(v, min, max)
}

const dateish = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

const datetimeish = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)

const emailish = v => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function day(v) {
  if (v === undefined || v === null || v === '') return new Date().toISOString().slice(0, 10)
  return dateish(v) ? v : undefined
}

module.exports = { text, optext, num, optnum, dateish, datetimeish, emailish, day }
