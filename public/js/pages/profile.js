import { el, toast, modal } from '../ui.js'
import { api, download } from '../api.js'
import { store } from '../store.js'
import { wtunit, showwt, inkg } from '../units.js'

export async function profile() {
  const page = el('div', { class: 'page' })
  const { user } = await api.get('/api/auth/me')
  store.user = user

  page.append(el('div', { class: 'page-head' },
    el('div', {},
      el('h1', {}, 'profile & goals'),
      el('p', { class: 'sub' }, `training since ${new Date(user.created.replace(' ', 'T')).toLocaleDateString('en', { month: 'long', year: 'numeric' })}`))))

  const inputs = {}

  function field(key, label, type = 'number', attrs = {}) {
    inputs[key] = el('input', { class: 'input', type, value: user[key] ?? '', ...attrs })
    return el('div', { class: 'field' }, el('label', {}, label), inputs[key])
  }

  const identity = el('div', { class: 'card mb-16' },
    el('div', { class: 'card-title' }, 'identity'),
    el('div', { class: 'flex mb-16' },
      el('div', {
        style: 'width:56px;height:56px;border-radius:16px;background:var(--volt-glow);border:1px solid var(--volt-dim);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:var(--volt)',
      }, (user.name || '?')[0].toUpperCase()),
      el('div', {},
        el('div', { style: 'font-weight:700;font-size:16px' }, user.name),
        el('div', { class: 'muted', style: 'font-size:13px' }, user.email))),
    field('name', 'display name', 'text'))

  inputs.units = el('select', { class: 'input' },
    el('option', { value: 'metric', selected: user.units !== 'imperial' || null }, 'metric (kg)'),
    el('option', { value: 'imperial', selected: user.units === 'imperial' || null }, 'imperial (lb)'))

  inputs.goal_weight = el('input', {
    class: 'input', type: 'number', min: 1, step: 0.5, placeholder: 'optional',
    value: user.goal_weight ? showwt(user.goal_weight) : '',
  })

  const goals = el('div', { class: 'card mb-16' },
    el('div', { class: 'card-title' }, 'goals & units'),
    el('div', { class: 'grid cols-2' },
      field('goal_cal', 'calories / day (kcal)', 'number', { min: 800, max: 8000 }),
      field('goal_protein', 'protein / day (g)', 'number', { min: 20, max: 400 }),
      field('goal_water', 'water / day (ml)', 'number', { min: 500, max: 8000, step: 250 }),
      field('goal_workouts', 'workouts / week', 'number', { min: 1, max: 14 }),
      el('div', { class: 'field' }, el('label', {}, `target bodyweight (${wtunit()})`), inputs.goal_weight),
      el('div', { class: 'field' }, el('label', {}, 'units'), inputs.units)))

  const save = el('button', {
    class: 'btn primary lg', onclick: async () => {
      save.disabled = true
      try {
        const payload = {
          name: inputs.name.value.trim() || user.name,
          goal_cal: +inputs.goal_cal.value || 2200,
          goal_protein: +inputs.goal_protein.value || 140,
          goal_water: +inputs.goal_water.value || 3000,
          goal_workouts: +inputs.goal_workouts.value || 4,
          goal_weight: +inputs.goal_weight.value ? inkg(+inputs.goal_weight.value) : null,
          units: inputs.units.value,
        }
        const res = await api.patch('/api/auth/me', payload)
        store.user = res.user
        toast('profile saved')
        location.reload()
      } catch (err) {
        toast(err.message, 'error')
        save.disabled = false
      }
    },
  }, 'save changes')

  const current = el('input', { class: 'input', type: 'password', autocomplete: 'current-password' })
  const next = el('input', { class: 'input', type: 'password', autocomplete: 'new-password', minlength: 6 })
  const security = el('div', { class: 'card mt-24' },
    el('div', { class: 'card-title' }, 'security'),
    el('div', { class: 'grid cols-2' },
      el('div', { class: 'field' }, el('label', {}, 'current password'), current),
      el('div', { class: 'field' }, el('label', {}, 'new password (min 6)'), next)),
    el('button', {
      class: 'btn', onclick: async e => {
        e.target.disabled = true
        try {
          await api.patch('/api/auth/password', { current: current.value, next: next.value })
          toast('password changed')
          current.value = ''
          next.value = ''
        } catch (err) {
          toast(err.message, 'error')
        }
        e.target.disabled = false
      },
    }, 'change password'))

  const themesel = el('select', {
    class: 'input', style: 'max-width:220px',
    onchange: e => {
      if (e.target.value === 'light') {
        document.documentElement.dataset.theme = 'light'
        localStorage.setItem('fitnation_theme', 'light')
      } else {
        delete document.documentElement.dataset.theme
        localStorage.removeItem('fitnation_theme')
      }
      toast('theme updated')
    },
  },
    el('option', { value: 'dark', selected: localStorage.getItem('fitnation_theme') !== 'light' || null }, 'dark (default)'),
    el('option', { value: 'light', selected: localStorage.getItem('fitnation_theme') === 'light' || null }, 'light'))

  const appearance = el('div', { class: 'card mt-24' },
    el('div', { class: 'card-title' }, 'appearance'),
    el('div', { class: 'field' }, el('label', {}, 'theme (this device)'), themesel))

  const exports = el('div', { class: 'card mt-24' },
    el('div', { class: 'card-title' }, 'export your data'),
    el('p', { class: 'muted mb-16', style: 'font-size:13.5px' }, 'your data is yours. download it as csv anytime. weights are always exported in kg.'),
    el('div', { class: 'flex wrap' },
      el('button', { class: 'btn sm', onclick: () => download('/api/export/workouts').catch(err => toast(err.message, 'error')) }, '⬇ workouts'),
      el('button', { class: 'btn sm', onclick: () => download('/api/export/weights').catch(err => toast(err.message, 'error')) }, '⬇ bodyweight'),
      el('button', { class: 'btn sm', onclick: () => download('/api/export/meals').catch(err => toast(err.message, 'error')) }, '⬇ meals')))

  function importbtn(label, endpoint, describe) {
    const file = el('input', { type: 'file', accept: '.csv,text/csv', style: 'display:none' })
    file.addEventListener('change', async () => {
      const f = file.files[0]
      if (!f) return
      try {
        const csv = await f.text()
        const res = await api.post(endpoint, { csv })
        toast(describe(res))
      } catch (err) {
        toast(err.message, 'error')
      }
      file.value = ''
    })
    return el('span', {},
      el('button', { class: 'btn sm', onclick: () => file.click() }, label), file)
  }

  function applehealthbtn() {
    const utc = s => {
      if (!s) return null
      const d = new Date(s)
      return isNaN(d) ? null : d.toISOString().replace('T', ' ').slice(0, 19)
    }
    const activity = t => {
      const n = (t || '').replace('HKWorkoutActivityType', '')
      return n.replace(/([A-Z])/g, ' $1').trim().toLowerCase() || 'workout'
    }
    const file = el('input', { type: 'file', accept: '.xml,text/xml', style: 'display:none' })
    file.addEventListener('change', async () => {
      const f = file.files[0]
      if (!f) return
      try {
        const xml = await f.text()
        const days = new Map()
        for (const [tag] of xml.matchAll(/<Record[^>]*type="HKQuantityTypeIdentifierBodyMass"[^>]*\/?>/g)) {
          const unit = (tag.match(/unit="([^"]*)"/) || [])[1] || 'kg'
          const value = +((tag.match(/value="([^"]*)"/) || [])[1] || 0)
          const date = ((tag.match(/startDate="([^"]*)"/) || [])[1] || '').slice(0, 10)
          if (!value || !date) continue
          const kg = unit === 'lb' ? value / 2.2046226218 : unit === 'st' ? value * 6.35029318 : value
          days.set(date, Math.round(kg * 100) / 100)
        }
        const sessions = []
        for (const [tag] of xml.matchAll(/<Workout [^>]*>/g)) {
          const started = utc((tag.match(/startDate="([^"]*)"/) || [])[1])
          if (!started) continue
          sessions.push({
            name: activity((tag.match(/workoutActivityType="([^"]*)"/) || [])[1]),
            started,
            ended: utc((tag.match(/endDate="([^"]*)"/) || [])[1]),
          })
        }
        if (!days.size && !sessions.length) {
          return toast('no bodyweight or workout records found in that file', 'error')
        }
        let weighins = 0
        let workouts = 0
        if (days.size) {
          const csv = 'date,kg\n' + [...days.entries()].map(([d, kg]) => `${d},${kg}`).join('\n')
          weighins = (await api.post('/api/import/weights', { csv })).imported
        }
        if (sessions.length) {
          workouts = (await api.post('/api/import/sessions', { sessions: sessions.slice(0, 2000) })).imported
        }
        toast(`apple health: ${weighins} weigh-ins, ${workouts} workouts imported`)
      } catch (err) {
        toast(err.message, 'error')
      }
      file.value = ''
    })
    return el('span', {},
      el('button', { class: 'btn sm', title: 'health app > profile picture > export all health data, then pick export.xml', onclick: () => file.click() }, '⬆ apple health'), file)
  }

  const imports = el('div', { class: 'card mt-24' },
    el('div', { class: 'card-title' }, 'restore & import'),
    el('p', { class: 'muted mb-16', style: 'font-size:13.5px' }, 'import fitnation csv exports, or bodyweight and workout history from an apple health export (export.xml). already-imported rows are skipped, so re-importing is safe.'),
    el('div', { class: 'flex wrap' },
      importbtn('⬆ workouts', '/api/import/workouts', r => `imported ${r.workouts} workouts, ${r.sets} sets`),
      importbtn('⬆ bodyweight', '/api/import/weights', r => `imported ${r.imported} weigh-ins`),
      importbtn('⬆ meals', '/api/import/meals', r => `imported ${r.imported} meals`),
      applehealthbtn()))

  function deleteaccount() {
    modal((box, close) => {
      const pw = el('input', { class: 'input', type: 'password', placeholder: 'your password', autocomplete: 'current-password' })
      box.append(
        el('h3', {}, 'delete account'),
        el('p', { class: 'muted mb-16', style: 'font-size:13.5px' },
          'this permanently deletes your account and every workout, set, meal, weigh-in, measurement, template and recipe. there is no undo. export your data first if you want to keep it.'),
        el('div', { class: 'field' }, el('label', {}, 'confirm with your password'), pw),
        el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
          el('button', {
            class: 'btn danger', onclick: async e => {
              e.target.disabled = true
              try {
                await api.post('/api/auth/delete', { password: pw.value })
                close()
                store.logout()
              } catch (err) {
                toast(err.message, 'error')
                e.target.disabled = false
              }
            },
          }, 'delete everything')))
      setTimeout(() => pw.focus(), 50)
    })
  }

  const danger = el('div', { class: 'card mt-24' },
    el('div', { class: 'card-title' }, 'session & account'),
    el('p', { class: 'muted mb-16', style: 'font-size:13.5px' }, 'you\'re logged in on this device. logging out keeps all your data safe on the server.'),
    el('div', { class: 'flex wrap' },
      el('button', { class: 'btn', onclick: () => store.logout() }, 'log out'),
      el('button', { class: 'btn danger', onclick: deleteaccount }, 'delete account…')))

  page.append(identity, goals, save, appearance, security, exports, imports, danger)
  return page
}
