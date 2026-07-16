import { el, fmt, spinner, empty, modal, toast, confirmdialog } from '../ui.js'
import { api } from '../api.js'
import { linechart } from '../charts.js'
import { anatomy } from '../anatomy.js'
import { wtunit, showwt } from '../units.js'

const muscles = ['chest', 'back', 'lats', 'lower back', 'shoulders', 'biceps', 'triceps',
  'legs', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'full body', 'cardio']

export async function exercises() {
  const page = el('div', { class: 'page' })

  page.append(el('div', { class: 'page-head' },
    el('div', {},
      el('h1', {}, 'exercise library'),
      el('p', { class: 'sub' }, 'movements with cues, targets and your personal history.')),
    el('button', { class: 'btn primary', onclick: createexercise }, '+ new exercise')))

  let all = []
  let muscle = ''
  let query = ''

  const search = el('input', {
    class: 'input mb-16', placeholder: 'search by name…', style: 'max-width:380px',
    oninput: () => { query = search.value.toLowerCase(); draw() },
  })

  const chips = el('div', { class: 'flex wrap mb-16' })
  const grid = el('div', { class: 'grid cols-3' }, spinner())
  page.append(search, chips, grid)

  load()
  async function load() {
    try {
      const res = await api.get('/api/exercises')
      all = res.exercises
      const present = [...new Set(all.map(x => x.muscle))].sort()
      chips.replaceChildren(chip('all', ''), ...present.map(m => chip(m, m)))
      draw()
    } catch (err) {
      grid.replaceChildren(empty('⚠️', err.message))
    }
  }

  function chip(label, value) {
    return el('span', {
      class: `chip ${muscle === value ? 'active' : ''}`,
      onclick: e => {
        muscle = value
        chips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
        e.target.classList.add('active')
        draw()
      },
    }, label)
  }

  function draw() {
    const matched = all.filter(x =>
      (!muscle || x.muscle === muscle) && (!query || x.name.includes(query)))
    if (!matched.length) {
      grid.replaceChildren(empty('🔍', 'no exercises match your filters.'))
      return
    }
    grid.replaceChildren(...matched.map(x =>
      el('div', { class: 'card interactive', onclick: () => detail(x) },
        el('div', { class: 'flex between mb-16' },
          el('span', { class: 'chip', style: 'cursor:default' }, x.muscle),
          el('div', { class: 'flex', style: 'gap:6px' },
            x.user_id && el('span', { class: 'badge', style: 'background:var(--volt-glow);color:var(--volt)' }, 'custom'),
            el('span', { class: `badge ${x.difficulty}` }, x.difficulty))),
        el('h3', { style: 'font-size:16px;text-transform:capitalize' }, x.name),
        el('p', { class: 'muted', style: 'font-size:13px;margin-top:6px' }, x.cues),
        el('p', { class: 'dim', style: 'font-size:12px;margin-top:10px' }, `⚙ ${x.equipment}`))))
  }

  function createexercise(prefill = '') {
    modal((box, close) => {
      const name = el('input', { class: 'input', value: typeof prefill === 'string' ? prefill : '', placeholder: 'e.g. cable pullover' })
      const musclesel = el('select', { class: 'input' }, ...muscles.map(m => el('option', { value: m }, m)))
      const equipment = el('input', { class: 'input', placeholder: 'e.g. cable, dumbbell, machine' })
      const difficulty = el('select', { class: 'input' },
        ...['beginner', 'intermediate', 'advanced'].map(d => el('option', { value: d }, d)))
      const cues = el('input', { class: 'input', placeholder: 'one line of coaching cues' })
      box.append(
        el('h3', {}, 'new exercise'),
        el('div', { class: 'field' }, el('label', {}, 'name'), name),
        el('div', { class: 'field' }, el('label', {}, 'muscle'), musclesel),
        el('div', { class: 'field' }, el('label', {}, 'equipment'), equipment),
        el('div', { class: 'field' }, el('label', {}, 'difficulty'), difficulty),
        el('div', { class: 'field' }, el('label', {}, 'cues'), cues),
        el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
          el('button', {
            class: 'btn primary', onclick: async () => {
              try {
                await api.post('/api/exercises', {
                  name: name.value, muscle: musclesel.value,
                  equipment: equipment.value, difficulty: difficulty.value, cues: cues.value,
                })
                close()
                toast('exercise created')
                load()
              } catch (err) {
                toast(err.message, 'error')
              }
            },
          }, 'create')))
      setTimeout(() => name.focus(), 50)
    })
  }

  async function detail(x) {
    const [{ history, pr }, { similar }] = await Promise.all([
      api.get(`/api/exercises/${x.id}/history`),
      api.get(`/api/exercises/${x.id}/similar`).catch(() => ({ similar: [] })),
    ])
    modal((box, close) => {
      box.append(
        el('div', { class: 'flex between' },
          el('h3', { style: 'text-transform:capitalize;margin-bottom:4px' }, x.name),
          el('span', { class: `badge ${x.difficulty}` }, x.difficulty)),
        el('p', { class: 'muted', style: 'font-size:13px;margin-bottom:12px' }, `${x.muscle} · ${x.equipment}`),
        anatomy(x.muscle),
        el('p', { style: 'font-size:14px;margin:16px 0 20px' }, x.cues ? `💡 ${x.cues}` : ''))

      if (similar.length) {
        box.append(
          el('div', { class: 'card-title', style: 'margin-bottom:8px' }, '⇄ swap it for'),
          el('div', { class: 'flex wrap mb-16' }, ...similar.map(s =>
            el('span', {
              class: 'chip', title: `${s.equipment} · ${s.difficulty}`,
              onclick: () => { close(); detail(s) },
            }, s.name))))
      }

      if (x.user_id) {
        box.append(el('button', {
          class: 'btn danger sm mb-16', onclick: () => {
            close()
            confirmdialog(`"${x.name}" will be removed from your library.`, async () => {
              try {
                await api.delete(`/api/exercises/${x.id}`)
                toast('exercise deleted')
                load()
              } catch (err) {
                toast(err.message, 'error')
              }
            })
          },
        }, 'delete custom exercise'))
      }

      if (!history.length) {
        box.append(empty('📊', 'no sets logged yet. add it to a workout to start tracking.'))
        return
      }

      box.append(el('div', { class: 'grid cols-3 mb-16' },
        pill('best weight', `${fmt.num1(showwt(pr.max_weight))} ${wtunit()}`),
        pill('est. 1rm', `${fmt.num1(showwt(pr.est_1rm))} ${wtunit()}`),
        pill('best set volume', `${fmt.num(showwt(pr.max_volume))} ${wtunit()}`)))

      const bydate = new Map()
      for (const h of [...history].reverse()) {
        const d = h.started.slice(0, 10)
        bydate.set(d, Math.max(bydate.get(d) || 0, h.weight))
      }
      const points = [...bydate.entries()].map(([d, v]) => ({ label: fmt.date(d), value: showwt(v) }))
      if (points.length > 1) {
        box.append(el('div', { class: 'card-title' }, 'top set weight over time'))
        box.append(linechart(points, { unit: ` ${wtunit()}`, height: 160 }))
      }

      box.append(el('div', { class: 'card-title mt-16' }, 'recent sets'))
      box.append(el('div', { class: 'table-wrap' },
        el('table', { class: 'data' },
          el('thead', {}, el('tr', {},
            el('th', {}, 'date'), el('th', {}, wtunit()), el('th', {}, 'reps'), el('th', {}, 'rpe'))),
          el('tbody', {}, ...history.slice(0, 10).map(h =>
            el('tr', {},
              el('td', { class: 'muted' }, fmt.date(h.started)),
              el('td', {}, String(showwt(h.weight))),
              el('td', {}, String(h.reps)),
              el('td', { class: 'dim' }, h.rpe != null ? String(h.rpe) : '–')))))))
    })
  }

  function pill(label, value) {
    return el('div', { class: 'stat', style: 'padding:12px 14px' },
      el('div', { class: 'label', style: 'font-size:10px' }, label),
      el('div', { class: 'value', style: 'font-size:17px' }, value))
  }

  return page
}
