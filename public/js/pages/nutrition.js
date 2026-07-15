import { el, fmt, spinner, empty, modal, toast, macrobar } from '../ui.js'
import { api } from '../api.js'
import { store } from '../store.js'

const slots = ['breakfast', 'lunch', 'dinner', 'snack']
const sloticons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

export async function nutrition() {
  const user = store.user || {}
  const page = el('div', { class: 'page' })
  let date = new Date().toISOString().slice(0, 10)

  const datelabel = el('span', { style: 'font-weight:600;min-width:110px;text-align:center' })
  const head = el('div', { class: 'page-head' },
    el('div', {},
      el('h1', {}, 'nutrition'),
      el('p', { class: 'sub' }, 'fuel the machine.')),
    el('div', { class: 'flex' },
      el('button', { class: 'icon-btn', onclick: () => shift(-1) }, '←'),
      datelabel,
      el('button', { class: 'icon-btn', onclick: () => shift(1) }, '→')))

  const body = el('div', {}, spinner())
  page.append(head, body)

  function shift(days) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    date = d.toISOString().slice(0, 10)
    load()
  }

  load()
  async function load() {
    const today = new Date().toISOString().slice(0, 10)
    datelabel.textContent = date === today ? 'today' :
      new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
    try {
      const [{ meals, totals }, { ml }] = await Promise.all([
        api.get(`/api/meals?date=${date}`),
        api.get(`/api/water?date=${date}`),
      ])
      body.replaceChildren(build(meals, totals, ml))
    } catch (err) {
      body.replaceChildren(empty('⚠️', err.message))
    }
  }

  function build(meals, totals, waterml) {
    const wrap = el('div', {})

    const goalwater = user.goal_water || 3000
    const cups = Math.ceil(goalwater / 250)
    const filled = Math.min(Math.round(waterml / 250), cups)

    wrap.append(el('div', { class: 'grid cols-2 mb-16' },
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, 'macros'),
        macrobar('calories', totals.cal, user.goal_cal || 2200, 'var(--volt)'),
        macrobar('protein (g)', totals.protein, user.goal_protein || 140, 'var(--rose)'),
        macrobar('carbs (g)', totals.carbs, Math.round((user.goal_cal || 2200) * 0.45 / 4), 'var(--sky)'),
        macrobar('fat (g)', totals.fat, Math.round((user.goal_cal || 2200) * 0.3 / 9), 'var(--amber)')),
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, `water · ${(waterml / 1000).toFixed(1)} / ${(goalwater / 1000).toFixed(1)} l`),
        el('p', { class: 'dim', style: 'font-size:13px' }, 'one cup = 250 ml. tap to log.'),
        el('div', { class: 'water-cups' },
          ...Array.from({ length: cups }, (_, i) =>
            el('div', {
              class: `cup ${i < filled ? 'filled' : ''}`,
              title: '+250 ml',
              onclick: async () => {
                await api.post('/api/water', { ml: 250, date })
                load()
              },
            }))))))

    for (const slot of slots) {
      const inslot = meals.filter(m => m.slot === slot)
      const slotcal = inslot.reduce((s, m) => s + m.cal * m.qty, 0)
      wrap.append(el('div', { class: 'card mb-16' },
        el('div', { class: 'card-title' },
          el('span', {}, `${sloticons[slot]} ${slot}`),
          el('div', { class: 'flex' },
            slotcal > 0 && el('span', { class: 'dim', style: 'font-size:12px' }, `${fmt.num(slotcal)} kcal`),
            el('button', { class: 'btn sm', onclick: () => addfood(slot) }, '+ add'))),
        inslot.length
          ? el('div', { class: 'list' }, ...inslot.map(m =>
              el('div', { class: 'row-item' },
                el('div', { class: 'grow' },
                  el('div', { class: 'title' }, m.name),
                  el('div', { class: 'meta' },
                    `${m.qty} × ${m.serving} · p ${fmt.num1(m.protein * m.qty)} · c ${fmt.num1(m.carbs * m.qty)} · f ${fmt.num1(m.fat * m.qty)}`)),
                el('span', { class: 'num' }, `${fmt.num(m.cal * m.qty)} kcal`),
                el('button', {
                  class: 'icon-btn danger',
                  onclick: async () => {
                    await api.delete(`/api/meals/${m.id}`)
                    load()
                  },
                }, '✕'))))
          : el('p', { class: 'dim', style: 'font-size:13px' }, 'nothing logged.')))
    }

    return wrap
  }

  async function addfood(slot) {
    const { foods } = await api.get('/api/foods')
    modal((box, close) => {
      const list = el('div', { class: 'list', style: 'max-height:40vh;overflow-y:auto' })
      const search = el('input', {
        class: 'input mb-16', placeholder: 'search foods…',
        oninput: () => draw(search.value.toLowerCase()),
      })

      function draw(q = '') {
        const matched = foods.filter(f => f.name.includes(q))
        list.replaceChildren(...matched.slice(0, 40).map(f =>
          el('div', { class: 'row-item interactive', onclick: () => pickqty(f) },
            el('div', { class: 'grow' },
              el('div', { class: 'title' }, f.name),
              el('div', { class: 'meta' }, `${f.serving} · ${fmt.num(f.cal)} kcal · ${fmt.num1(f.protein)} g protein`)))))
        if (!matched.length) {
          list.replaceChildren(
            empty('🔍', 'not in the database.'),
            el('button', { class: 'btn full', onclick: () => customfood(q) }, `+ create "${q}"`))
        }
      }

      function pickqty(f) {
        box.replaceChildren(
          el('h3', {}, f.name),
          el('p', { class: 'muted mb-16', style: 'font-size:13px' },
            `per ${f.serving}: ${fmt.num(f.cal)} kcal · p ${fmt.num1(f.protein)} · c ${fmt.num1(f.carbs)} · f ${fmt.num1(f.fat)}`))
        const qty = el('input', { class: 'input', type: 'number', step: '0.25', min: '0.25', value: '1' })
        box.append(
          el('div', { class: 'field' }, el('label', {}, `servings (${f.serving} each)`), qty),
          el('div', { class: 'modal-actions' },
            el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
            el('button', {
              class: 'btn primary', onclick: async () => {
                await api.post('/api/meals', { food_id: f.id, qty: +qty.value || 1, slot, date })
                close()
                toast(`${f.name} logged`)
                load()
              },
            }, 'log it')))
        qty.focus()
        qty.select()
      }

      function customfood(name) {
        box.replaceChildren(el('h3', {}, 'new food'))
        const inputs = {}
        const fields = [['name', name, 'text'], ['serving', '100 g', 'text'],
          ['cal', '', 'number'], ['protein', '', 'number'], ['carbs', '', 'number'], ['fat', '', 'number']]
        for (const [key, val, type] of fields) {
          inputs[key] = el('input', { class: 'input', type, value: val, step: '0.1', min: '0' })
          box.append(el('div', { class: 'field' }, el('label', {}, key), inputs[key]))
        }
        box.append(el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
          el('button', {
            class: 'btn primary', onclick: async () => {
              const res = await api.post('/api/foods', {
                name: inputs.name.value, serving: inputs.serving.value,
                cal: +inputs.cal.value || 0, protein: +inputs.protein.value || 0,
                carbs: +inputs.carbs.value || 0, fat: +inputs.fat.value || 0,
              })
              await api.post('/api/meals', { food_id: res.food.id, qty: 1, slot, date })
              close()
              toast(`${res.food.name} created & logged`)
              load()
            },
          }, 'create & log')))
      }

      draw()
      box.append(el('h3', {}, `add to ${slot}`), search, list)
      setTimeout(() => search.focus(), 50)
    })
  }

  return page
}
