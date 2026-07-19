import { el, fmt, spinner, empty, modal, toast } from '../ui.js'
import { api } from '../api.js'
import { wtunit, showwt, inkg, imperial } from '../units.js'
import { sharecard } from '../share.js'

export async function session(id) {
  const page = el('div', { class: 'page' })
  const head = el('div', { class: 'page-head' })
  const body = el('div', {}, spinner())
  page.append(head, body)

  let workout = null
  let sets = []
  let pending = []
  let last = {}
  const linkedto = new Map()
  let timer = null
  let restinterval = null
  let restleft = 0
  const restchip = el('span', { class: 'session-timer', style: 'display:none;background:rgba(86,184,255,0.14);color:var(--sky);cursor:pointer', title: 'tap to skip rest' })
  restchip.addEventListener('click', () => stoprest())

  function restmap() {
    try {
      return JSON.parse(localStorage.getItem('fitnation_rest_ex')) || {}
    } catch {
      return {}
    }
  }

  function restsecs(exid) {
    const map = restmap()
    if (exid != null && map[exid] != null) return +map[exid]
    const v = localStorage.getItem('fitnation_rest')
    return v === null ? 90 : +v
  }

  function startrest(exid) {
    const secs = restsecs(exid)
    if (!secs) return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
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
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('rest over', { body: 'back to the bar. next set 🔔', icon: '/icon.svg' })
          } catch {}
        }
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
      linkedto.clear()
      for (const s of sets) {
        if (s.superset != null && s.superset !== s.exercise_id) linkedto.set(s.exercise_id, s.superset)
      }
      if (!sets.length && !pending.length) {
        const stash = sessionStorage.getItem(`fitnation_pending_${id}`)
        if (stash) {
          try {
            pending = JSON.parse(stash)
          } catch {}
        }
      }
      if (workout.template_id && !sets.length && !pending.length) {
        try {
          const t = await api.get(`/api/templates/${workout.template_id}`)
          pending = t.template.data.map(x => ({ id: x.id, name: x.name, muscle: x.muscle }))
        } catch {}
      }
      await loadhints()
      renderhead()
      renderbody()
    } catch (err) {
      body.replaceChildren(empty('⚠️', err.message))
    }
  }

  async function loadhints() {
    const ids = [...new Set([...sets.map(s => s.exercise_id), ...pending.map(p => p.id)])]
    if (!ids.length) {
      last = {}
      return
    }
    try {
      last = (await api.get(`/api/exercises/last?ids=${ids.join(',')}&exclude=${id}`)).last
    } catch {
      last = {}
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
        !live && sets.length > 0 && el('button', {
          class: 'btn sm', title: 'share this workout as an image',
          onclick: () => sharecard(workout, sets),
        }, '⇪ share'),
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

    const order = [...groups.keys()]
    order.forEach((exid, i) => wrap.append(block(exid, groups.get(exid), i > 0 ? order[i - 1] : null)))

    wrap.append(el('button', { class: 'btn full lg mt-16', onclick: pickexercise }, '+ add exercise'))
    body.replaceChildren(wrap)
  }

  function minstat(label, value) {
    return el('div', { class: 'stat', style: 'padding:14px 18px' },
      el('div', { class: 'label' }, label),
      el('div', { class: 'value', style: 'font-size:22px' }, String(value)))
  }

  function togglelink(exid, prevexid) {
    if (linkedto.has(exid)) linkedto.delete(exid)
    else linkedto.set(exid, linkedto.get(prevexid) || prevexid)
    renderbody()
  }

  function block(exid, group, prevexid) {
    const linked = linkedto.has(exid)
    const card = el('div', { class: `card exercise-block ${linked ? 'linked' : ''}` })
    const exmap = restmap()

    card.append(el('div', { class: 'eb-head' },
      el('div', { class: 'flex', style: 'gap:8px' },
        el('h4', {}, group.name),
        linked && el('span', { class: 'chip active', style: 'cursor:default;font-size:10.5px;padding:2px 8px' }, 'superset')),
      el('div', { class: 'flex', style: 'gap:2px' },
        el('span', { class: 'muscle', style: 'margin-right:6px' }, group.muscle),
        !group.sets.length && !workout.ended && el('button', {
          class: 'icon-btn', title: 'swap for a similar exercise',
          onclick: () => swap(exid, group.name),
        }, '⇄'),
        prevexid != null && el('button', {
          class: 'icon-btn', title: linked ? 'unlink superset' : 'superset with exercise above',
          style: linked ? 'color:var(--volt)' : '',
          onclick: () => togglelink(exid, prevexid),
        }, '⛓'),
        el('button', {
          class: 'icon-btn', title: 'plate calculator',
          onclick: () => platecalc(currentweight()),
        }, '🏋'),
        el('button', {
          class: 'icon-btn', title: 'rest timer for this exercise',
          style: exmap[exid] != null ? 'color:var(--sky)' : '',
          onclick: () => exrest(exid, group.name),
        }, '⏱'))))

    const l = last[exid]
    if (l) {
      const bump = imperial() ? 5 : 2.5
      const nudge = l.weight > 0
        ? el('button', {
            class: 'chip', title: 'fill in a small increase over last time',
            onclick: () => {
              w.value = Math.round((showwt(l.weight) + bump) * 10) / 10
              r.value = l.reps
              w.focus()
            },
          }, `try +${bump} ${wtunit()}`)
        : el('button', {
            class: 'chip', title: 'fill in one more rep than last time',
            onclick: () => {
              w.value = ''
              r.value = l.reps + 1
              r.focus()
            },
          }, 'try +1 rep')
      card.append(el('div', { class: 'eb-hint' },
        `last: ${l.weight > 0 ? `${showwt(l.weight)} ${wtunit()} × ` : ''}${l.reps} ${l.weight > 0 ? '' : 'reps '}· ${fmt.date(l.started)}`,
        !workout.ended && nudge))
    }

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

    const lastset = group.sets[group.sets.length - 1]
    const w = el('input', { class: 'input', type: 'number', step: '0.5', min: '0', placeholder: wtunit(), value: lastset ? showwt(lastset.weight) : '' })
    const r = el('input', { class: 'input', type: 'number', step: '1', min: '0', placeholder: 'reps', value: lastset ? lastset.reps : '' })
    const rpe = el('input', { class: 'input', type: 'number', step: '0.5', min: '1', max: '10', placeholder: '–' })

    function currentweight() {
      return +w.value || (lastset ? showwt(lastset.weight) : (l && l.weight > 0 ? showwt(l.weight) : ''))
    }

    async function addset() {
      if (workout.ended) return toast('workout is finished. start a new one to keep training', 'error')
      if (!+r.value) return toast('enter reps first', 'error')
      const res = await api.post(`/api/workouts/${id}/sets`, {
        exercise_id: exid, weight: inkg(+w.value || 0), reps: +r.value || 0,
        rpe: rpe.value ? +rpe.value : null,
        superset: linkedto.get(exid) ?? null,
      })
      sets.push(res.set)
      pending = pending.filter(p => p.id !== exid)
      if (res.pr) toast(`new ${group.name} pr. all-time best set 🏆`, 'pr')
      if (sets.length === 1) renderhead()
      startrest(exid)
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

  async function swap(exid, name) {
    const { similar } = await api.get(`/api/exercises/${exid}/similar`)
    modal((box, close) => {
      box.append(
        el('h3', {}, `swap ${name}`),
        el('p', { class: 'muted mb-16', style: 'font-size:13.5px' }, 'similar movements by muscle and equipment. machine taken? swap, don\'t wait.'))
      if (!similar.length) {
        box.append(empty('🔍', 'no similar movements in your library.'))
        return
      }
      box.append(el('div', { class: 'list' }, ...similar.map(x =>
        el('div', {
          class: 'row-item interactive',
          onclick: async () => {
            close()
            if (pending.some(p => p.id === x.id) || sets.some(s => s.exercise_id === x.id)) {
              return toast(`${x.name} is already in this workout`, 'error')
            }
            pending = pending.map(p => p.id === exid ? { id: x.id, name: x.name, muscle: x.muscle } : p)
            await loadhints()
            renderbody()
            toast(`swapped to ${x.name}`)
          },
        },
          el('div', { class: 'grow' },
            el('div', { class: 'title' }, x.name),
            el('div', { class: 'meta' }, `${x.muscle} · ${x.equipment}`)),
          el('span', { class: `badge ${x.difficulty}` }, x.difficulty)))))
    })
  }

  function platecalc(initial) {
    const imp = imperial()
    const bars = imp ? [45, 35, 15] : [20, 15, 10]
    const plates = imp ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25]
    modal((box, close) => {
      const target = el('input', { class: 'input', type: 'number', step: imp ? '5' : '2.5', min: '0', value: initial || '', oninput: calc })
      const bar = el('select', { class: 'input', onchange: calc },
        ...bars.map((b, i) => el('option', { value: b, selected: i === 0 || null }, `${b} ${wtunit()} bar`)))
      const out = el('div', { class: 'mt-16' })

      function calc() {
        const t = +target.value
        if (!t) {
          out.replaceChildren(el('p', { class: 'dim', style: 'font-size:13.5px' }, 'enter a target weight.'))
          return
        }
        let side = (t - +bar.value) / 2
        if (side < 0) {
          out.replaceChildren(el('p', { class: 'dim', style: 'font-size:13.5px' }, 'that is lighter than the bar.'))
          return
        }
        const used = []
        for (const p of plates) {
          while (side >= p - 1e-9) {
            used.push(p)
            side -= p
          }
        }
        const loaded = t - side * 2
        out.replaceChildren(
          el('p', { style: 'font-weight:700;font-size:14px;margin-bottom:10px' },
            used.length ? `per side · ${fmt.num1(loaded)} ${wtunit()} total` : 'empty bar'),
          el('div', { class: 'flex wrap' }, ...used.map(p => el('span', { class: 'plate' }, String(p)))),
          side > 0.01
            ? el('p', { class: 'dim mt-8', style: 'font-size:12.5px' }, `closest load below target. ${fmt.num1(side * 2)} ${wtunit()} short.`)
            : '')
      }

      calc()
      box.append(
        el('h3', {}, 'plate calculator'),
        el('div', { class: 'grid cols-2' },
          el('div', { class: 'field' }, el('label', {}, `target (${wtunit()})`), target),
          el('div', { class: 'field' }, el('label', {}, 'bar'), bar)),
        out,
        el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => close() }, 'close')))
      setTimeout(() => target.focus(), 50)
    })
  }

  function exrest(exid, name) {
    const map = restmap()
    modal((box, close) => {
      const opts = [['', 'use default'], [0, 'off'], [60, '1:00'], [90, '1:30'], [120, '2:00'], [180, '3:00']]
      const current = map[exid] != null ? String(map[exid]) : ''
      const sel = el('select', { class: 'input' },
        ...opts.map(([v, label]) => el('option', { value: v, selected: String(v) === current || null }, label)))
      box.append(
        el('h3', {}, `rest after ${name}`),
        el('p', { class: 'muted mb-16', style: 'font-size:13.5px' }, 'overrides the workout-wide rest timer for this exercise only.'),
        el('div', { class: 'field' }, el('label', {}, 'rest duration'), sel),
        el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', onclick: () => close() }, 'cancel'),
          el('button', {
            class: 'btn primary', onclick: () => {
              if (sel.value === '') delete map[exid]
              else map[exid] = +sel.value
              localStorage.setItem('fitnation_rest_ex', JSON.stringify(map))
              close()
              toast('rest updated')
              renderbody()
            },
          }, 'save')))
    })
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
            onclick: async () => {
              close()
              if (!pending.some(p => p.id === x.id) && !sets.some(s => s.exercise_id === x.id)) {
                pending.push({ id: x.id, name: x.name, muscle: x.muscle })
                await loadhints()
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
