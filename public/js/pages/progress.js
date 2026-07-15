import { el, fmt, spinner, empty, toast, modal } from '../ui.js'
import { api } from '../api.js'
import { store } from '../store.js'
import { linechart, barchart, donut } from '../charts.js'
import { wtunit, showwt, inkg } from '../units.js'

const musclecolors = ['var(--volt)', 'var(--sky)', 'var(--rose)', 'var(--violet)', 'var(--amber)', 'var(--ember)', 'var(--success)']

export async function progress() {
  const user = store.user || {}
  const page = el('div', { class: 'page' })

  page.append(el('div', { class: 'page-head' },
    el('div', {},
      el('h1', {}, 'progress'),
      el('p', { class: 'sub' }, 'the numbers don\'t lie.')),
    el('button', { class: 'btn primary', onclick: logweight }, '+ log weight')))

  const body = el('div', {}, spinner())
  page.append(body)

  load()
  async function load() {
    try {
      const [vol, muscles, cals, prs, weights, report] = await Promise.all([
        api.get('/api/stats/volume?days=60'),
        api.get('/api/stats/muscles'),
        api.get('/api/stats/calories?days=14'),
        api.get('/api/stats/prs'),
        api.get('/api/weights'),
        api.get('/api/stats/report'),
      ])
      body.replaceChildren(build(vol.volume, muscles.muscles, cals.calories, prs.prs, weights.weights, report))
    } catch (err) {
      body.replaceChildren(empty('⚠️', err.message))
    }
  }

  function delta(now, before, unit = '') {
    const d = now - before
    if (!before) return el('span', { class: 'dim' }, 'first week')
    const up = d >= 0
    return el('span', { style: `color:${up ? 'var(--success)' : 'var(--danger)'};font-weight:700;font-size:13px` },
      `${up ? '▲' : '▼'} ${fmt.num1(Math.abs(d))}${unit} vs last week`)
  }

  function reviewcard(r) {
    const wdelta = r.weight.latest && r.weight.previous && r.weight.latest.date !== r.weight.previous.date
      ? showwt(r.weight.latest.kg) - showwt(r.weight.previous.kg)
      : null
    return el('div', { class: 'card mb-16' },
      el('div', { class: 'card-title' }, '📋 week in review · last 7 days'),
      el('div', { class: 'grid cols-4' },
        el('div', {},
          el('div', { class: 'label muted', style: 'font-size:11px;text-transform:uppercase;letter-spacing:0.05em' }, 'workouts'),
          el('div', { style: 'font-size:24px;font-weight:800' }, String(r.this_week.workouts)),
          delta(r.this_week.workouts, r.last_week.workouts)),
        el('div', {},
          el('div', { class: 'label muted', style: 'font-size:11px;text-transform:uppercase;letter-spacing:0.05em' }, 'volume'),
          el('div', { style: 'font-size:24px;font-weight:800' }, `${fmt.num(showwt(r.this_week.volume))} ${wtunit()}`),
          delta(showwt(r.this_week.volume), showwt(r.last_week.volume), ` ${wtunit()}`)),
        el('div', {},
          el('div', { class: 'label muted', style: 'font-size:11px;text-transform:uppercase;letter-spacing:0.05em' }, 'avg calories'),
          el('div', { style: 'font-size:24px;font-weight:800' }, fmt.num(r.nutrition.avg_cal)),
          el('span', { class: 'dim', style: 'font-size:13px' }, `${r.nutrition.days_logged}/7 days logged`)),
        el('div', {},
          el('div', { class: 'label muted', style: 'font-size:11px;text-transform:uppercase;letter-spacing:0.05em' }, 'bodyweight'),
          el('div', { style: 'font-size:24px;font-weight:800' },
            r.weight.latest ? `${fmt.num1(showwt(r.weight.latest.kg))} ${wtunit()}` : '–'),
          wdelta === null
            ? el('span', { class: 'dim', style: 'font-size:13px' }, 'log weigh-ins to track')
            : el('span', { style: `color:${wdelta <= 0 ? 'var(--success)' : 'var(--amber)'};font-weight:700;font-size:13px` },
                `${wdelta <= 0 ? '▼' : '▲'} ${fmt.num1(Math.abs(wdelta))} ${wtunit()}`))),
      r.prs_this_week.length
        ? el('p', { style: 'margin-top:14px;font-size:13.5px' },
            `🏆 new pr${r.prs_this_week.length > 1 ? 's' : ''} this week: `,
            el('b', { class: 'volt' }, r.prs_this_week.map(p => `${p.name} (${fmt.num1(showwt(p.weight))} ${wtunit()})`).join(', ')))
        : el('p', { class: 'dim', style: 'margin-top:14px;font-size:13px' }, 'no new prs this week. chase one.'))
  }

  function build(volume, muscles, calories, prs, weights, report) {
    const wrap = el('div', {})

    wrap.append(reviewcard(report))

    wrap.append(el('div', { class: 'grid cols-2 mb-16' },
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, 'training volume · last 60 days'),
        volume.length
          ? linechart(volume.map(v => ({ label: fmt.date(v.date), value: Math.round(showwt(v.volume)) })), { unit: ` ${wtunit()}` })
          : empty('📉', 'no training data yet.')),
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, 'bodyweight'),
        weights.length
          ? linechart([...weights].reverse().map(w => ({ label: fmt.date(w.date), value: showwt(w.kg) })),
              { unit: ` ${wtunit()}`, color: 'var(--violet)' })
          : empty('⚖️', 'log your first weigh-in to see the curve.'))))

    const musclesplit = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, 'muscle split · last 30 days'))
    if (muscles.length) {
      musclesplit.append(
        donut(muscles.slice(0, 7).map((m, i) => ({ label: m.muscle, value: m.sets, color: musclecolors[i % musclecolors.length] }))),
        el('div', { class: 'flex wrap mt-16', style: 'justify-content:center' },
          ...muscles.slice(0, 7).map((m, i) =>
            el('span', { class: 'chip', style: 'cursor:default' },
              el('span', { style: `width:9px;height:9px;border-radius:50%;background:${musclecolors[i % musclecolors.length]};display:inline-block` }),
              `${m.muscle} · ${m.sets}`))))
    } else {
      musclesplit.append(empty('🎯', 'train to see your split.'))
    }

    const calcard = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, 'calories · last 14 days'),
      calories.length
        ? barchart(calories.map(c => ({
            label: fmt.date(c.date), value: Math.round(c.cal),
            highlight: c.cal <= (user.goal_cal || 2200),
          })), { unit: ' kcal' })
        : empty('🍽', 'no meals logged yet.'),
      calories.length
        ? el('p', { class: 'dim center', style: 'font-size:12px;margin-top:8px' }, 'green bars = on or under your calorie goal')
        : '')

    wrap.append(el('div', { class: 'grid cols-2 mb-16' }, musclesplit, calcard))

    const prcard = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, '🏆 personal record board'))
    if (prs.length) {
      prcard.append(el('div', { class: 'table-wrap' },
        el('table', { class: 'data' },
          el('thead', {}, el('tr', {},
            el('th', {}, 'exercise'), el('th', {}, 'muscle'),
            el('th', {}, 'best weight'), el('th', {}, 'est. 1rm'), el('th', {}, 'sets'))),
          el('tbody', {}, ...prs.map((p, i) =>
            el('tr', {},
              el('td', { style: 'text-transform:capitalize;font-weight:600' },
                `${i === 0 ? '👑 ' : ''}${p.name}`),
              el('td', { class: 'muted' }, p.muscle),
              el('td', {}, `${fmt.num1(showwt(p.max_weight))} ${wtunit()}`),
              el('td', { class: 'volt', style: 'font-weight:700' }, `${fmt.num1(showwt(p.est_1rm))} ${wtunit()}`),
              el('td', { class: 'muted' }, String(p.total_sets))))))))
    } else {
      prcard.append(empty('🏆', 'lift heavy things to earn a spot on the board.'))
    }
    wrap.append(prcard)

    return wrap
  }

  function logweight() {
    modal((box, close) => {
      const w = el('input', { class: 'input', type: 'number', step: '0.1', min: '1', placeholder: wtunit() === 'lb' ? '165.0' : '75.0' })
      const date = el('input', { class: 'input', type: 'date', value: new Date().toISOString().slice(0, 10) })
      box.append(
        el('h3', {}, 'log bodyweight'),
        el('div', { class: 'field' }, el('label', {}, `weight (${wtunit()})`), w),
        el('div', { class: 'field' }, el('label', {}, 'date'), date),
        el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
          el('button', {
            class: 'btn primary', onclick: async () => {
              if (!+w.value) return toast('enter a weight', 'error')
              await api.post('/api/weights', { kg: inkg(+w.value), date: date.value })
              close()
              toast('weigh-in logged')
              load()
            },
          }, 'save')))
      setTimeout(() => w.focus(), 50)
    })
  }

  return page
}
