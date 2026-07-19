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
            inslot.length > 0 && el('button', {
              class: 'icon-btn', title: 'save as recipe',
              onclick: () => saverecipe(slot, inslot),
            }, '★'),
            el('button', {
              class: 'icon-btn', title: `copy yesterday's ${slot}`,
              onclick: async () => {
                const d = new Date(date)
                d.setDate(d.getDate() - 1)
                try {
                  const res = await api.post('/api/meals/copy', { from: d.toISOString().slice(0, 10), date, slot })
                  toast(`copied ${res.copied} from yesterday`)
                  load()
                } catch (err) {
                  toast(err.message, 'error')
                }
              },
            }, '↻'),
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

  function saverecipe(slot, inslot) {
    modal((box, close) => {
      const name = el('input', { class: 'input', placeholder: `e.g. my usual ${slot}` })
      box.append(
        el('h3', {}, 'save as recipe'),
        el('p', { class: 'muted mb-16', style: 'font-size:13.5px' },
          `saves these ${inslot.length} food${inslot.length > 1 ? 's' : ''} as a one-tap preset in the food picker.`),
        el('div', { class: 'field' }, el('label', {}, 'recipe name'), name),
        el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
          el('button', {
            class: 'btn primary', onclick: async () => {
              try {
                await api.post('/api/recipes', {
                  name: name.value.trim() || `${slot} preset`,
                  items: inslot.map(m => ({ food_id: m.food_id, qty: m.qty })),
                })
                close()
                toast('recipe saved')
              } catch (err) {
                toast(err.message, 'error')
              }
            },
          }, 'save')))
      setTimeout(() => name.focus(), 50)
    })
  }

  async function addfood(slot) {
    const [{ foods }, { recipes }] = await Promise.all([
      api.get('/api/foods'),
      api.get('/api/recipes').catch(() => ({ recipes: [] })),
    ])
    let stopscan = () => {}
    modal((box, close) => {
      const list = el('div', { class: 'list', style: 'max-height:40vh;overflow-y:auto' })
      const search = el('input', {
        class: 'input', placeholder: 'search foods…',
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
            el('button', { class: 'btn full mb-8', onclick: () => offsearch(q) }, `🌐 search open food facts for "${q}"`),
            el('button', { class: 'btn full', onclick: () => customfood(q) }, `+ create "${q}"`))
        }
      }

      async function offsearch(q) {
        list.replaceChildren(spinner())
        try {
          const { results } = await api.get(`/api/foods/search?q=${encodeURIComponent(q)}`)
          if (!results.length) {
            list.replaceChildren(
              empty('🌐', 'nothing found online either.'),
              el('button', { class: 'btn full', onclick: () => customfood(q) }, `+ create "${q}"`))
            return
          }
          list.replaceChildren(
            el('p', { class: 'dim', style: 'font-size:12px;margin-bottom:8px' }, 'from open food facts · macros per 100 g'),
            ...results.map(f =>
              el('div', { class: 'row-item interactive', onclick: () => pickqty(f) },
                el('div', { class: 'grow' },
                  el('div', { class: 'title' }, f.name),
                  el('div', { class: 'meta' }, `${f.serving} · ${fmt.num(f.cal)} kcal · ${fmt.num1(f.protein)} g protein`)))))
        } catch (err) {
          list.replaceChildren(
            empty('⚠️', err.message),
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
                let fid = f.id
                if (!fid) fid = (await api.post('/api/foods', f)).food.id
                await api.post('/api/meals', { food_id: fid, qty: +qty.value || 1, slot, date })
                close()
                toast(`${f.name} logged`)
                load()
              },
            }, 'log it')))
        qty.focus()
        qty.select()
      }

      function scanui() {
        stopscan()
        box.replaceChildren(el('h3', {}, 'scan a barcode'))
        const video = el('video', {
          autoplay: '', muted: '', playsinline: '',
          style: 'width:100%;max-height:44vh;border-radius:14px;background:#000;object-fit:cover',
        })
        const status = el('p', { class: 'dim', style: 'font-size:13px;margin-top:10px' }, 'point your camera at the barcode.')
        box.append(video, status, el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => { stopscan(); close() } }, 'cancel'),
          el('button', { class: 'btn', onclick: () => { stopscan(); manualui() } }, 'type it instead')))
        start()
        async function start() {
          if (!('BarcodeDetector' in window) || !navigator.mediaDevices) {
            status.textContent = 'this browser cannot scan. type the code instead.'
            return
          }
          let stream
          let detector
          try {
            detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          } catch {
            status.textContent = 'camera unavailable or blocked. type the code instead.'
            return
          }
          video.srcObject = stream
          const poll = setInterval(async () => {
            try {
              const codes = await detector.detect(video)
              if (codes.length && /^\d{6,14}$/.test(codes[0].rawValue)) {
                stopscan()
                lookup(codes[0].rawValue)
              }
            } catch {}
          }, 350)
          stopscan = () => {
            clearInterval(poll)
            stream.getTracks().forEach(t => t.stop())
            stopscan = () => {}
          }
        }
      }

      function manualui() {
        box.replaceChildren(el('h3', {}, 'enter barcode'))
        const code = el('input', {
          class: 'input', type: 'text', inputmode: 'numeric',
          placeholder: 'the digits under the bars',
        })
        code.addEventListener('keydown', e => { if (e.key === 'Enter') go() })
        function go() {
          const c = code.value.replace(/\D/g, '')
          if (c.length < 6 || c.length > 14) return toast('that does not look like a barcode', 'error')
          lookup(c)
        }
        box.append(
          el('div', { class: 'field' }, el('label', {}, 'barcode number'), code),
          el('div', { class: 'modal-actions' },
            el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
            el('button', { class: 'btn primary', onclick: go }, 'look it up')))
        setTimeout(() => code.focus(), 50)
      }

      async function lookup(c) {
        box.replaceChildren(el('h3', {}, 'looking it up…'), spinner())
        try {
          const { food } = await api.get(`/api/foods/barcode/${c}`)
          pickqty(food)
        } catch (err) {
          box.replaceChildren(
            el('h3', {}, 'no luck'),
            empty('📷', err.message),
            el('div', { class: 'modal-actions' },
              el('button', { class: 'btn ghost', onclick: () => close() }, 'close'),
              el('button', { class: 'btn primary', onclick: scanui }, 'scan again')))
        }
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
      const recipebox = recipes.length
        ? el('div', { class: 'mb-16' },
            el('label', { style: 'font-size:13px;font-weight:600;color:var(--muted);display:block;margin-bottom:8px' }, 'recipes'),
            el('div', { class: 'flex wrap' }, ...recipes.map(r =>
              el('span', { class: 'chip', title: r.data.map(x => x.name).join(', ') },
                el('span', {
                  style: 'cursor:pointer',
                  onclick: async () => {
                    try {
                      const res = await api.post(`/api/recipes/${r.id}/log`, { slot, date })
                      close()
                      toast(`${r.name} logged (${res.logged} foods)`)
                      load()
                    } catch (err) {
                      toast(err.message, 'error')
                    }
                  },
                }, `★ ${r.name}`),
                el('span', {
                  style: 'cursor:pointer;margin-left:4px;opacity:0.6', title: 'delete recipe',
                  onclick: async e => {
                    e.stopPropagation()
                    await api.delete(`/api/recipes/${r.id}`)
                    e.target.closest('.chip').remove()
                    toast('recipe deleted')
                  },
                }, '✕')))))
        : ''
      box.append(el('h3', {}, `add to ${slot}`), recipebox,
        el('div', { class: 'flex mb-16', style: 'gap:8px' },
          el('div', { class: 'grow' }, search),
          el('button', { class: 'icon-btn', title: 'scan a barcode', style: 'font-size:18px', onclick: scanui }, '📷')),
        list)
      setTimeout(() => search.focus(), 50)
    }, { onclose: () => stopscan() })
  }

  return page
}
