import { el, toast } from '../ui.js'
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

  const exports = el('div', { class: 'card mt-24' },
    el('div', { class: 'card-title' }, 'export your data'),
    el('p', { class: 'muted mb-16', style: 'font-size:13.5px' }, 'your data is yours. download it as csv anytime. weights are always exported in kg.'),
    el('div', { class: 'flex wrap' },
      el('button', { class: 'btn sm', onclick: () => download('/api/export/workouts').catch(err => toast(err.message, 'error')) }, '⬇ workouts'),
      el('button', { class: 'btn sm', onclick: () => download('/api/export/weights').catch(err => toast(err.message, 'error')) }, '⬇ bodyweight'),
      el('button', { class: 'btn sm', onclick: () => download('/api/export/meals').catch(err => toast(err.message, 'error')) }, '⬇ meals')))

  const danger = el('div', { class: 'card mt-24' },
    el('div', { class: 'card-title' }, 'session'),
    el('p', { class: 'muted mb-16', style: 'font-size:13.5px' }, 'you\'re logged in on this device. logging out keeps all your data safe on the server.'),
    el('button', { class: 'btn danger', onclick: () => store.logout() }, 'log out'))

  page.append(identity, goals, save, security, exports, danger)
  return page
}
