import { el, fmt, ring, spinner, empty, toast } from '../ui.js'
import { api } from '../api.js'
import { store } from '../store.js'
import { wtunit, showwt } from '../units.js'

export async function dashboard() {
  const user = store.user || {}
  const page = el('div', { class: 'page' })

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'burning the midnight oil' : hour < 12 ? 'good morning' : hour < 17 ? 'good afternoon' : 'good evening'

  page.append(el('div', { class: 'page-head' },
    el('div', {},
      el('h1', {}, `${greeting}, ${user.name || 'athlete'}`),
      el('p', { class: 'sub' }, new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })),
    ),
    el('button', {
      class: 'btn primary', onclick: async () => {
        const res = await api.post('/api/workouts', { name: 'workout' })
        location.hash = `#/workouts/${res.workout.id}`
      },
    }, '+ start workout')))

  const body = el('div', {}, spinner())
  page.append(body)

  load()
  async function load() {
    try {
      const s = await api.get('/api/stats/dashboard')
      body.replaceChildren(build(s))
    } catch (err) {
      body.replaceChildren(empty('⚠️', err.message))
    }
  }

  function build(s) {
    const wrap = el('div', {})

    wrap.append(el('div', { class: 'grid cols-4 mb-16' },
      stat('streak', `${s.streak}`, 'days', s.streak > 0 ? 'keep it alive 🔥' : 'train today to start one', 'var(--ember)'),
      stat('this week', `${s.week.workouts}`, `/ ${user.goal_workouts || 4} workouts`,
        s.week.workouts >= (user.goal_workouts || 4) ? 'weekly goal hit ✓' : `${(user.goal_workouts || 4) - s.week.workouts} to go`, 'var(--volt)'),
      stat('week volume', fmt.num(showwt(s.week.volume)), wtunit(), 'total weight moved', 'var(--sky)'),
      stat('all time', `${s.total}`, 'workouts', s.weight ? `last weigh-in ${fmt.num1(showwt(s.weight.kg))} ${wtunit()}` : 'log your weight in progress', 'var(--violet)')))

    const cal = s.today.cal
    const goalcal = user.goal_cal || 2200
    const protein = s.today.protein
    const goalprotein = user.goal_protein || 140
    const water = s.today.water
    const goalwater = user.goal_water || 3000

    wrap.append(el('div', { class: 'grid cols-3 mb-16' },
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, 'calories today',
          el('a', { href: '#/nutrition', class: 'volt', style: 'font-size:12px' }, 'log →')),
        el('div', { class: 'ring-wrap' },
          ring({ pct: cal / goalcal, big: fmt.num(cal), small: 'kcal', color: 'var(--volt)' }),
          el('div', {},
            el('div', { class: 'muted', style: 'font-size:13px' }, `goal ${fmt.num(goalcal)} kcal`),
            el('div', { style: 'font-size:13px;margin-top:4px' },
              cal >= goalcal ? 'goal reached ✓' : `${fmt.num(goalcal - cal)} kcal remaining`)))),
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, 'protein today',
          el('a', { href: '#/nutrition', class: 'volt', style: 'font-size:12px' }, 'log →')),
        el('div', { class: 'ring-wrap' },
          ring({ pct: protein / goalprotein, big: fmt.num(protein), small: 'grams', color: 'var(--rose)' }),
          el('div', {},
            el('div', { class: 'muted', style: 'font-size:13px' }, `goal ${goalprotein} g`),
            el('div', { style: 'font-size:13px;margin-top:4px' },
              protein >= goalprotein ? 'goal reached ✓' : `${fmt.num(goalprotein - protein)} g remaining`)))),
      el('div', { class: 'card' },
        el('div', { class: 'card-title' }, 'water today'),
        el('div', { class: 'ring-wrap' },
          ring({ pct: water / goalwater, big: `${(water / 1000).toFixed(1)}`, small: 'liters', color: 'var(--sky)' }),
          el('div', { class: 'grow' },
            el('div', { class: 'muted', style: 'font-size:13px' }, `goal ${(goalwater / 1000).toFixed(1)} l`),
            el('button', {
              class: 'btn sm mt-8', onclick: async e => {
                e.target.disabled = true
                await api.post('/api/water', { ml: 250 })
                toast('+250 ml logged')
                load()
              },
            }, '+ 250 ml'))))))

    const recent = el('div', { class: 'card' },
      el('div', { class: 'card-title' }, 'recent workouts',
        el('a', { href: '#/workouts', class: 'volt', style: 'font-size:12px' }, 'all →')),
      s.recent.length
        ? el('div', { class: 'list' }, ...s.recent.map(w =>
            el('a', { class: 'row-item interactive', href: `#/workouts/${w.id}` },
              el('div', { class: 'grow' },
                el('div', { class: 'title' }, w.name),
                el('div', { class: 'meta' }, `${fmt.datetime(w.started)} · ${w.set_count} sets`)),
              el('div', { class: 'num volt' }, `${fmt.num(showwt(w.volume))} ${wtunit()}`),
              !w.ended && el('span', { class: 'chip active', style: 'cursor:default' }, 'live'))))
        : empty('🏋️', 'no workouts yet. hit start workout and move some iron.'))

    wrap.append(recent)
    return wrap
  }

  function stat(label, value, unit, hint, color) {
    return el('div', { class: 'stat' },
      el('div', { class: 'glow', style: `background:${color}` }),
      el('div', { class: 'label' }, label),
      el('div', { class: 'value' }, value, el('span', { class: 'unit' }, unit)),
      el('div', { class: 'hint' }, hint))
  }

  return page
}
