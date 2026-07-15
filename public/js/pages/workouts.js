import { el, fmt, spinner, empty, confirmdialog, toast } from '../ui.js'
import { api } from '../api.js'
import { wtunit, showwt } from '../units.js'

const pagesize = 30

export async function workouts() {
  const page = el('div', { class: 'page' })
  let all = []
  let total = 0

  page.append(el('div', { class: 'page-head' },
    el('div', {},
      el('h1', {}, 'workouts'),
      el('p', { class: 'sub' }, 'every session, logged.')),
    el('button', {
      class: 'btn primary', onclick: async () => {
        const res = await api.post('/api/workouts', { name: 'workout' })
        location.hash = `#/workouts/${res.workout.id}`
      },
    }, '+ start workout')))

  const templatebox = el('div', {})
  const body = el('div', {}, spinner())
  page.append(templatebox, body)

  loadtemplates()
  load()

  async function loadtemplates() {
    try {
      const { templates } = await api.get('/api/templates')
      if (!templates.length) {
        templatebox.replaceChildren()
        return
      }
      templatebox.replaceChildren(
        el('h3', { class: 'muted', style: 'font-size:13px;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 10px' }, 'templates'),
        el('div', { class: 'grid cols-3 mb-16' }, ...templates.map(t =>
          el('div', { class: 'card', style: 'padding:16px' },
            el('div', { class: 'flex between' },
              el('div', { class: 'grow' },
                el('div', { style: 'font-weight:700;font-size:14px' }, t.name),
                el('div', { class: 'meta muted', style: 'font-size:12.5px;margin-top:2px' },
                  t.data.map(x => x.name).slice(0, 3).join(', ') + (t.data.length > 3 ? ` +${t.data.length - 3}` : ''))),
              el('button', {
                class: 'icon-btn danger', title: 'delete template',
                onclick: () => confirmdialog(`template "${t.name}" will be removed.`, async () => {
                  await api.delete(`/api/templates/${t.id}`)
                  toast('template deleted')
                  loadtemplates()
                }),
              }, '✕')),
            el('button', {
              class: 'btn sm primary mt-8', onclick: async () => {
                const res = await api.post(`/api/templates/${t.id}/start`)
                location.hash = `#/workouts/${res.workout.id}`
              },
            }, '▶ start')))))
    } catch {
      templatebox.replaceChildren()
    }
  }

  async function load() {
    try {
      const res = await api.get(`/api/workouts?limit=${pagesize}&offset=${all.length}`)
      all = all.concat(res.workouts)
      total = res.total
      draw()
    } catch (err) {
      body.replaceChildren(empty('⚠️', err.message))
    }
  }

  function draw() {
    if (!all.length) {
      body.replaceChildren(empty('🏋️', 'nothing here yet. your first workout is one tap away.'))
      return
    }

    const groups = new Map()
    for (const w of all) {
      const month = new Date(w.started.replace(' ', 'T')).toLocaleDateString('en', { month: 'long', year: 'numeric' })
      if (!groups.has(month)) groups.set(month, [])
      groups.get(month).push(w)
    }

    const out = el('div', {})
    for (const [month, list] of groups) {
      out.append(el('h3', { class: 'muted', style: 'font-size:13px;text-transform:uppercase;letter-spacing:0.06em;margin:22px 0 10px' }, month))
      out.append(el('div', { class: 'list' }, ...list.map(w => row(w))))
    }
    if (all.length < total) {
      out.append(el('button', { class: 'btn full mt-16', onclick: load },
        `load more (${total - all.length} older)`))
    }
    body.replaceChildren(out)
  }

  function row(w) {
    const duration = w.ended ? fmt.duration(w.started, w.ended) : null
    return el('div', {
      class: 'row-item interactive',
      onclick: () => { location.hash = `#/workouts/${w.id}` },
    },
      el('div', { class: 'grow' },
        el('div', { class: 'title' }, w.name, !w.ended
          ? el('span', { class: 'chip active', style: 'margin-left:8px;cursor:default' }, 'live')
          : ''),
        el('div', { class: 'meta' },
          `${fmt.datetime(w.started)} · ${w.exercise_count} exercises · ${w.set_count} sets${duration ? ` · ${duration}` : ''}`)),
      el('div', { class: 'num volt' }, `${fmt.num(showwt(w.volume))} ${wtunit()}`),
      el('button', {
        class: 'icon-btn danger', title: 'delete workout',
        onclick: e => {
          e.stopPropagation()
          confirmdialog(`"${w.name}" and all its sets will be gone forever.`, async () => {
            await api.delete(`/api/workouts/${w.id}`)
            toast('workout deleted')
            all = all.filter(x => x.id !== w.id)
            total--
            draw()
          })
        },
      }, '✕'))
  }

  return page
}
