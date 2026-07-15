import { el, fmt, spinner, empty, modal, toast } from '../ui.js'
import { api } from '../api.js'
import { wtunit, showwt, inkg } from '../units.js'

export async function session(id) {
  const page = el('div', { class: 'page' })
  const head = el('div', { class: 'page-head' })
  const body = el('div', {}, spinner())
  page.append(head, body)

  let workout = null
  let sets = []
  let pending = []
  let timer = null
  let restinterval = null
  let restleft = 0
  const restchip = el('span', { class: 'session-timer', style: 'display:none;background:rgba(86,184,255,0.14);color:var(--sky);cursor:pointer', title: 'tap to skip rest' })
  restchip.addEventListener('click', () => stoprest())

  function restsecs() {
    return +localStorage.getItem('fitnation_rest') || 90
  }

  function startrest() {
    const secs = restsecs()
    if (!secs) return
    restleft = secs
    restchip.style.display = ''
    drawrest()
    clearInterval(restinterval)
    restinterval = setInterval(() => {
      restleft--
      if (restleft <= 0) {
        stoprest()
        beep()
        toast('rest over. next set 🔔', 'info')
      } else {
        drawrest()
      }
    }, 1000)
  }

  function drawrest() {
    restchip.textContent = `rest ${Math.floor(restleft / 60)}:${String(restleft % 60).padStart(2, '0')}`
  }

  function stoprest() {
    clearInterval(restinterval)
    restchip.style.display = 'none'
  }

  function beep() {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  load()
  async function load() {
    try {
      const res = await api.get(`/api/workouts/${id}`)
      workout = res.workout
      sets = res.sets
      if (workout.template_id && !sets.length && !pending.length) {
        try {
          const t = await api.get(`/api/templates/${workout.template_id}`)
          pending = t.template.data.map(x => ({ id: x.id, name: x.name, muscle: x.muscle }))
        } catch {}
      }
      renderhead()
      renderbody()
    } catch (err) {
      body.replaceChildren(empty('⚠️', err.message))
    }
  }

  function elapsed() {
    const start = new Date(workout.started.replace(' ', 'T') + 'Z').getTime()
    const end = workout.ended ? new Date(workout.ended.replace(' ', 'T') + 'Z').getTime() : Date.now()
    const secs = Math.max(0, Math.floor((end - start) / 1000))
    const h = Math.floor(secs / 3600)
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return h ? `${h}:${m}:${s}` : `${m}:${s}`
  }

  function renderhead() {
    clearInterval(timer)
    const live = !workout.ended
    const timerbox = el('span', { class: 'session-timer' }, elapsed())
    if (live) timer = setInterval(() => { timerbox.textContent = elapsed() }, 1000)

    const namebox = el('input', {
      class: 'input', value: workout.name,
      style: 'font-size:22px;font-weight:700;background:transparent;border:none;padding:4px 0;max-width:320px',
      onchange: async e => {
        await api.patch(`/api/workouts/${id}`, { name: e.target.value.trim() || 'workout' })
        toast('renamed')
      },
    })

    const restpick = el('select', {
      class: 'input', style: 'width:auto;padding:7px 10px;font-size:13px', title: 'rest timer',
      onchange: e => { localStorage.setItem('fitnation_rest', e.target.value) },
    }, ...[[0, 'rest: off'], [60, 'rest: 1:00'], [90, 'rest: 1:30'], [120, 'rest: 2:00'], [180, 'rest: 3:00']].map(([v, label]) =>
      el('option', { value: v, selected: restsecs() === v || null }, label)))

    head.replaceChildren(
      el('div', {},
        el('div', { class: 'flex' },
          el('a', { class: 'icon-btn', href: '#/workouts', title: 'back' }, '←'),
          namebox),
        el('p', { class: 'sub', style: 'margin-left:44px' }, fmt.datetime(workout.started))),
      el('div', { class: 'flex wrap' },
        restchip,
        live && restpick,
        timerbox,
        sets.length > 0 && el('button', { class: 'btn sm', onclick: savetemplate }, 'save as template'),
        live
          ? el('button', {
              class: 'btn primary', onclick: async () => {
                stoprest()
                await api.patch(`/api/workouts/${id}`, { finish: true })
                toast('workout finished. nice work 💪')
                load()
              },
            }, 'finish')
          : el('span', { class: 'chip', style: 'cursor:default' }, `done · ${fmt.duration(workout.started, workout.ended)}`)))
  }

  function savetemplate() {
    modal((box, close) => {
      const name = el('input', { class: 'input', value: workout.name, placeholder: 'template name' })
      box.append(
        el('h3', {}, 'save as template'),
        el('p', { class: 'muted mb-16', style: 'font-size:13.5px' }, 'saves the exercise list of this workout so you can start it again with one tap.'),
        el('div', { class: 'field' }, el('label', {}, 'name'), name),
        el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
          el('button', {
            class: 'btn primary', onclick: async () => {
              try {
                await api.post('/api/templates', { name: name.value.trim() || workout.name, workout_id: +id })
                close()
                toast('template saved')
              } catch (err) {
                toast(err.message, 'error')
              }
            },
          }, 'save')))
      setTimeout(() => name.focus(), 50)
    })
  }

  function renderbody() {
    const volume = sets.reduce((s, x) => s + x.weight * x.reps, 0)
    const wrap = el('div', {})

    wrap.append(el('div', { class: 'grid cols-3 mb-16' },
      minstat('sets', sets.length),
      minstat('exercises', new Set(sets.map(s => s.exercise_id)).size + pending.length),
      minstat('volume', `${fmt.num(showwt(volume))} ${wtunit()}`)))

    const groups = new Map()
    for (const s of sets) {
      if (!groups.has(s.exercise_id)) groups.set(s.exercise_id, { name: s.exercise_name, muscle: s.muscle, sets: [] })
      groups.get(s.exercise_id).sets.push(s)
    }
    for (const p of pending) {
      if (!groups.has(p.id)) groups.set(p.id, { name: p.name, muscle: p.muscle, sets: [] })
    }

    if (!groups.size) wrap.append(empty('🎯', 'no sets yet. add an exercise to get moving.'))

    for (const [exid, group] of groups) wrap.append(block(exid, group))

    wrap.append(el('button', { class: 'btn full lg mt-16', onclick: pickexercise }, '+ add exercise'))
    body.replaceChildren(wrap)
  }

  function minstat(label, value) {
    return el('div', { class: 'stat', style: 'padding:14px 18px' },
      el('div', { class: 'label' }, label),
      el('div', { class: 'value', style: 'font-size:22px' }, String(value)))
  }

  function block(exid, group) {
    const card = el('div', { class: 'card exercise-block' })
    card.append(el('div', { class: 'eb-head' },
      el('h4', {}, group.name),
      el('span', { class: 'muscle' }, group.muscle)))

    card.append(el('div', { class: 'set-row' },
      el('span', {}), el('span', { class: 'col-h' }, wtunit()),
      el('span', { class: 'col-h' }, 'reps'), el('span', { class: 'col-h' }, 'rpe'), el('span', {})))

    group.sets.forEach((s, i) => {
      card.append(el('div', { class: 'set-row' },
        el('span', { class: 'sn' }, String(i + 1)),
        el('span', { class: 'val' }, String(showwt(s.weight))),
        el('span', { class: 'val' }, String(s.reps)),
        el('span', { class: 'val dim' }, s.rpe != null ? String(s.rpe) : '–'),
        el('button', {
          class: 'icon-btn danger', title: 'remove set',
          onclick: async () => {
            await api.delete(`/api/workouts/${id}/sets/${s.id}`)
            sets = sets.filter(x => x.id !== s.id)
            if (!sets.some(x => x.exercise_id === exid)) {
              pending.push({ id: exid, name: group.name, muscle: group.muscle })
            }
            renderbody()
          },
        }, '✕')))
    })

    const last = group.sets[group.sets.length - 1]
    const w = el('input', { class: 'input', type: 'number', step: '0.5', min: '0', placeholder: wtunit(), value: last ? showwt(last.weight) : '' })
    const r = el('input', { class: 'input', type: 'number', step: '1', min: '0', placeholder: 'reps', value: last ? last.reps : '' })
    const rpe = el('input', { class: 'input', type: 'number', step: '0.5', min: '1', max: '10', placeholder: '–' })

    async function addset() {
      if (workout.ended) return toast('workout is finished. start a new one to keep training', 'error')
      if (!+r.value) return toast('enter reps first', 'error')
      const res = await api.post(`/api/workouts/${id}/sets`, {
        exercise_id: exid, weight: inkg(+w.value || 0), reps: +r.value || 0,
        rpe: rpe.value ? +rpe.value : null,
      })
      sets.push(res.set)
      pending = pending.filter(p => p.id !== exid)
      if (sets.length === 1) renderhead()
      startrest()
      renderbody()
    }

    r.addEventListener('keydown', e => { if (e.key === 'Enter') addset() })
    rpe.addEventListener('keydown', e => { if (e.key === 'Enter') addset() })

    card.append(el('div', { class: 'set-row' },
      el('span', { class: 'sn' }, '+'),
      w, r, rpe,
      el('button', { class: 'icon-btn', style: 'color:var(--volt)', title: 'log set', onclick: addset }, '✓')))

    return card
  }

  async function pickexercise() {
    const { exercises } = await api.get('/api/exercises')
    modal((box, close) => {
      const list = el('div', { class: 'list', style: 'max-height:46vh;overflow-y:auto' })
      const search = el('input', {
        class: 'input mb-16', placeholder: 'search exercises…',
        oninput: () => draw(search.value.toLowerCase()),
      })

      function draw(q = '') {
        const matched = exercises.filter(x => x.name.includes(q) || x.muscle.includes(q))
        list.replaceChildren(...matched.slice(0, 40).map(x =>
          el('div', {
            class: 'row-item interactive',
            onclick: () => {
              close()
              if (!pending.some(p => p.id === x.id) && !sets.some(s => s.exercise_id === x.id)) {
                pending.push({ id: x.id, name: x.name, muscle: x.muscle })
              }
              renderbody()
            },
          },
            el('div', { class: 'grow' },
              el('div', { class: 'title' }, x.name),
              el('div', { class: 'meta' }, `${x.muscle} · ${x.equipment}`)),
            el('span', { class: `badge ${x.difficulty}` }, x.difficulty))))
        if (!matched.length) list.replaceChildren(empty('🔍', 'no exercises match'))
      }

      draw()
      box.append(el('h3', {}, 'add exercise'), search, list)
      setTimeout(() => search.focus(), 50)
    })
  }

  return page
}
