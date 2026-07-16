const { test, before, after } = require('node:test')
const assert = require('node:assert')
const { spawn } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

const port = 4699
const base = `http://localhost:${port}`
const dbfile = path.join(__dirname, '..', 'data', 'test.db')
let server
let token
let workout_id

async function req(method, url, body, auth = true) {
  const opts = { method, headers: { 'content-type': 'application/json' } }
  if (auth && token) opts.headers.authorization = `Bearer ${token}`
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(base + url, opts)
  return { status: res.status, data: await res.json() }
}

before(async () => {
  fs.rmSync(dbfile, { force: true })
  server = spawn('node', [path.join(__dirname, '..', 'server', 'index.js')], {
    env: { ...process.env, port, fitnation_db: dbfile },
  })
  await new Promise(resolve => {
    server.stdout.on('data', d => { if (d.toString().includes('running')) resolve() })
  })
})

after(() => server.kill())

test('rejects bad registration', async () => {
  const r = await req('POST', '/api/auth/register', { email: 'nope', password: '123', name: '' }, false)
  assert.equal(r.status, 400)
})

test('registers a user', async () => {
  const r = await req('POST', '/api/auth/register', {
    email: `t${Date.now()}@fit.test`, password: 'secret1', name: 'test athlete',
  }, false)
  assert.equal(r.status, 201)
  assert.ok(r.data.token)
  assert.equal(r.data.user.name, 'test athlete')
  token = r.data.token
})

test('rejects wrong password', async () => {
  const r = await req('POST', '/api/auth/login', { email: 'x@y.z', password: 'wrong' }, false)
  assert.equal(r.status, 401)
})

test('requires auth on protected routes', async () => {
  const res = await fetch(`${base}/api/workouts`)
  assert.equal(res.status, 401)
})

test('creates a workout and logs sets', async () => {
  const w = await req('POST', '/api/workouts', { name: 'push day' })
  assert.equal(w.status, 201)
  workout_id = w.data.workout.id

  const s = await req('POST', `/api/workouts/${workout_id}/sets`, { exercise_id: 1, weight: 100, reps: 5 })
  assert.equal(s.status, 201)
  assert.equal(s.data.set.weight, 100)

  const detail = await req('GET', `/api/workouts/${workout_id}`)
  assert.equal(detail.data.sets.length, 1)
})

test('finishes a workout', async () => {
  const r = await req('PATCH', `/api/workouts/${workout_id}`, { finish: true })
  assert.equal(r.status, 200)
  assert.ok(r.data.workout.ended)
})

test('logs meals and computes totals', async () => {
  const foods = await req('GET', '/api/foods?q=chicken breast')
  const food = foods.data.foods[0]
  const m = await req('POST', '/api/meals', { food_id: food.id, qty: 2, slot: 'lunch' })
  assert.equal(m.status, 201)

  const day = await req('GET', '/api/meals')
  assert.ok(day.data.totals.cal > 300)
  assert.ok(day.data.totals.protein > 60)
})

test('tracks water and weight', async () => {
  await req('POST', '/api/water', { ml: 500 })
  const w = await req('GET', '/api/water')
  assert.ok(w.data.ml >= 500)

  const kg = await req('POST', '/api/weights', { kg: 80 })
  assert.equal(kg.status, 201)
})

test('dashboard aggregates everything', async () => {
  const r = await req('GET', '/api/stats/dashboard')
  assert.equal(r.status, 200)
  assert.ok(r.data.total >= 1)
  assert.ok(r.data.today.cal > 0)
  assert.ok(r.data.today.water >= 500)
  assert.ok(r.data.streak >= 1)
})

test('stats endpoints respond', async () => {
  for (const p of ['/api/stats/volume', '/api/stats/muscles', '/api/stats/calories', '/api/stats/prs']) {
    const r = await req('GET', p)
    assert.equal(r.status, 200)
  }
})

test('users cannot touch other users data', async () => {
  const other = await req('POST', '/api/auth/register', {
    email: `intruder${Date.now()}@fit.test`, password: 'secret1', name: 'intruder',
  }, false)
  const old = token
  token = other.data.token
  const r = await req('GET', `/api/workouts/${workout_id}`)
  assert.equal(r.status, 404)
  const d = await req('DELETE', `/api/workouts/${workout_id}`)
  assert.equal(d.status, 404)
  token = old
})

test('serves the spa for unknown paths', async () => {
  const res = await fetch(`${base}/some/deep/route`)
  assert.equal(res.status, 200)
  const html = await res.text()
  assert.ok(html.includes('fitnation'))
})

test('saves and starts a template', async () => {
  const t = await req('POST', '/api/templates', { name: 'push day', workout_id })
  assert.equal(t.status, 201)
  assert.ok(t.data.template.data.length >= 1)

  const list = await req('GET', '/api/templates')
  assert.equal(list.data.templates.length, 1)

  const started = await req('POST', `/api/templates/${t.data.template.id}/start`)
  assert.equal(started.status, 201)
  assert.equal(started.data.workout.template_id, t.data.template.id)
  assert.equal(started.data.workout.name, 'push day')

  const one = await req('GET', `/api/templates/${t.data.template.id}`)
  assert.equal(one.status, 200)

  const gone = await req('DELETE', `/api/templates/${t.data.template.id}`)
  assert.equal(gone.status, 200)
})

test('rejects empty templates', async () => {
  const r = await req('POST', '/api/templates', { name: 'nothing' })
  assert.equal(r.status, 400)
})

test('paginates workouts', async () => {
  const page1 = await req('GET', '/api/workouts?limit=1&offset=0')
  assert.equal(page1.data.workouts.length, 1)
  assert.ok(page1.data.total >= 2)
  const page2 = await req('GET', '/api/workouts?limit=1&offset=1')
  assert.notEqual(page1.data.workouts[0].id, page2.data.workouts[0].id)
})

test('creates and scopes custom exercises', async () => {
  const c = await req('POST', '/api/exercises', {
    name: 'weird cable thing', muscle: 'lats', equipment: 'cable', difficulty: 'beginner', cues: 'pull',
  })
  assert.equal(c.status, 201)
  assert.equal(c.data.exercise.user_id > 0, true)

  const dupe = await req('POST', '/api/exercises', { name: 'weird cable thing' })
  assert.equal(dupe.status, 409)

  const mine = await req('GET', '/api/exercises?q=weird')
  assert.equal(mine.data.exercises.length, 1)

  const other = await req('POST', '/api/auth/register', {
    email: `scope${Date.now()}@fit.test`, password: 'secret1', name: 'scoper',
  }, false)
  const old = token
  token = other.data.token
  const theirs = await req('GET', '/api/exercises?q=weird')
  assert.equal(theirs.data.exercises.length, 0)
  token = old

  const del = await req('DELETE', `/api/exercises/${c.data.exercise.id}`)
  assert.equal(del.status, 200)
})

test('changes password and rejects the old one', async () => {
  const email = `pw${Date.now()}@fit.test`
  const reg = await req('POST', '/api/auth/register', { email, password: 'oldpass', name: 'pw tester' }, false)
  const old = token
  token = reg.data.token

  const wrong = await req('PATCH', '/api/auth/password', { current: 'nope', next: 'newpass1' })
  assert.equal(wrong.status, 401)

  const ok = await req('PATCH', '/api/auth/password', { current: 'oldpass', next: 'newpass1' })
  assert.equal(ok.status, 200)

  const oldlogin = await req('POST', '/api/auth/login', { email, password: 'oldpass' }, false)
  assert.equal(oldlogin.status, 401)
  const newlogin = await req('POST', '/api/auth/login', { email, password: 'newpass1' }, false)
  assert.equal(newlogin.status, 200)
  token = old
})

test('week report aggregates', async () => {
  const r = await req('GET', '/api/stats/report')
  assert.equal(r.status, 200)
  assert.ok(r.data.this_week.workouts >= 1)
  assert.ok('last_week' in r.data)
  assert.ok(r.data.nutrition.days_logged >= 1)
  assert.ok(Array.isArray(r.data.prs_this_week))
  assert.equal(typeof r.data.deload.flagged, 'boolean')
  assert.equal(r.data.deload.flagged, false)
})

test('exports csv', async () => {
  for (const path of ['/api/export/workouts', '/api/export/weights', '/api/export/meals']) {
    const res = await fetch(base + path, { headers: { authorization: `Bearer ${token}` } })
    assert.equal(res.status, 200)
    assert.ok(res.headers.get('content-type').includes('text/csv'))
    const text = await res.text()
    assert.ok(text.includes('\n'))
  }
})

test('serves pwa assets', async () => {
  for (const [path, type] of [['/manifest.json', 'application/json'], ['/sw.js', 'text/javascript'], ['/icon.svg', 'image/svg+xml']]) {
    const res = await fetch(base + path)
    assert.equal(res.status, 200)
    assert.ok(res.headers.get('content-type').includes(type))
  }
})

test('edits a template', async () => {
  const t = await req('POST', '/api/templates', { name: 'editable', exercises: [1, 2] })
  assert.equal(t.status, 201)
  const tid = t.data.template.id

  const renamed = await req('PATCH', `/api/templates/${tid}`, { name: 'edited', exercises: [3, 1] })
  assert.equal(renamed.status, 200)
  assert.equal(renamed.data.template.name, 'edited')
  assert.deepEqual(renamed.data.template.data.map(x => x.id), [3, 1])

  const emptied = await req('PATCH', `/api/templates/${tid}`, { exercises: [] })
  assert.equal(emptied.status, 400)

  await req('DELETE', `/api/templates/${tid}`)
})

test('copies meals from another day', async () => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  await req('POST', '/api/meals', { food_id: 1, qty: 1, slot: 'breakfast', date: yesterday })

  const r = await req('POST', '/api/meals/copy', { from: yesterday, slot: 'breakfast' })
  assert.equal(r.status, 201)
  assert.equal(r.data.copied, 1)

  const nothing = await req('POST', '/api/meals/copy', { from: '2001-01-01' })
  assert.equal(nothing.status, 404)

  const sameday = await req('POST', '/api/meals/copy', { from: new Date().toISOString().slice(0, 10) })
  assert.equal(sameday.status, 400)
})

test('saves and logs recipes', async () => {
  const bad = await req('POST', '/api/recipes', { name: 'no foods', items: [] })
  assert.equal(bad.status, 400)

  const r = await req('POST', '/api/recipes', { name: 'breakfast bowl', items: [{ food_id: 1, qty: 2 }, { food_id: 2, qty: 1 }] })
  assert.equal(r.status, 201)
  assert.equal(r.data.recipe.data.length, 2)

  const list = await req('GET', '/api/recipes')
  assert.ok(list.data.recipes.some(x => x.id === r.data.recipe.id))

  const logged = await req('POST', `/api/recipes/${r.data.recipe.id}/log`, { slot: 'breakfast' })
  assert.equal(logged.status, 201)
  assert.equal(logged.data.logged, 2)

  const gone = await req('DELETE', `/api/recipes/${r.data.recipe.id}`)
  assert.equal(gone.status, 200)
})

test('tracks body measurements', async () => {
  const bad = await req('POST', '/api/measurements', { kind: 'ear', value: 10 })
  assert.equal(bad.status, 400)

  const r = await req('POST', '/api/measurements', { kind: 'waist', value: 82.5 })
  assert.equal(r.status, 201)

  const upserted = await req('POST', '/api/measurements', { kind: 'waist', value: 82.0 })
  assert.equal(upserted.status, 201)

  const list = await req('GET', '/api/measurements?kind=waist')
  assert.equal(list.data.measurements.length, 1)
  assert.equal(list.data.measurements[0].value, 82.0)

  const del = await req('DELETE', `/api/measurements/${list.data.measurements[0].id}`)
  assert.equal(del.status, 200)
})

test('reports last set per exercise for overload hints', async () => {
  const w = await req('POST', '/api/workouts', { name: 'hint source' })
  await req('POST', `/api/workouts/${w.data.workout.id}/sets`, { exercise_id: 1, weight: 120, reps: 3 })
  await req('PATCH', `/api/workouts/${w.data.workout.id}`, { finish: true })

  const current = await req('POST', '/api/workouts', { name: 'hint target' })
  const r = await req('GET', `/api/exercises/last?ids=1,2&exclude=${current.data.workout.id}`)
  assert.equal(r.status, 200)
  assert.equal(r.data.last[1].weight, 120)
  assert.equal(r.data.last[1].reps, 3)

  await req('DELETE', `/api/workouts/${current.data.workout.id}`)
})

test('stores superset grouping on sets', async () => {
  const w = await req('POST', '/api/workouts', { name: 'superset day' })
  const wid = w.data.workout.id
  await req('POST', `/api/workouts/${wid}/sets`, { exercise_id: 1, weight: 60, reps: 10 })
  const s2 = await req('POST', `/api/workouts/${wid}/sets`, { exercise_id: 2, weight: 40, reps: 12, superset: 1 })
  assert.equal(s2.data.set.superset, 1)

  const detail = await req('GET', `/api/workouts/${wid}`)
  assert.equal(detail.data.sets.find(s => s.exercise_id === 2).superset, 1)
  await req('DELETE', `/api/workouts/${wid}`)
})

test('imports exported csv round trip', async () => {
  const workouts = await fetch(`${base}/api/export/workouts`, { headers: { authorization: `Bearer ${token}` } })
  const wcsv = await workouts.text()
  const weights = await fetch(`${base}/api/export/weights`, { headers: { authorization: `Bearer ${token}` } })
  const kgcsv = await weights.text()
  const meals = await fetch(`${base}/api/export/meals`, { headers: { authorization: `Bearer ${token}` } })
  const mcsv = await meals.text()

  const fresh = await req('POST', '/api/auth/register', {
    email: `restore${Date.now()}@fit.test`, password: 'secret1', name: 'restorer',
  }, false)
  const old = token
  token = fresh.data.token

  const iw = await req('POST', '/api/import/workouts', { csv: wcsv })
  assert.equal(iw.status, 201)
  assert.ok(iw.data.workouts >= 1)
  assert.ok(iw.data.sets >= 1)

  const again = await req('POST', '/api/import/workouts', { csv: wcsv })
  assert.equal(again.data.workouts, 0)

  const ik = await req('POST', '/api/import/weights', { csv: kgcsv })
  assert.equal(ik.status, 201)
  assert.ok(ik.data.imported >= 1)

  const im = await req('POST', '/api/import/meals', { csv: mcsv })
  assert.equal(im.status, 201)
  assert.ok(im.data.imported >= 1)

  const bad = await req('POST', '/api/import/weights', { csv: 'not,a\nvalid,file' })
  assert.equal(bad.status, 400)

  const mine = await req('GET', '/api/workouts')
  assert.ok(mine.data.total >= 1)
  token = old
})

test('suggests similar exercises', async () => {
  const r = await req('GET', '/api/exercises/1/similar')
  assert.equal(r.status, 200)
  assert.ok(r.data.similar.length >= 1)
  assert.ok(r.data.similar.every(x => x.muscle === 'legs'))
  assert.ok(r.data.similar.every(x => x.id !== 1))
  assert.equal(r.data.similar[0].equipment, 'barbell')

  const bogus = await req('GET', '/api/exercises/999999/similar')
  assert.equal(bogus.status, 404)
})

test('flags a deload when weekly volume collapses', async () => {
  const reg = await req('POST', '/api/auth/register', {
    email: `deload${Date.now()}@fit.test`, password: 'secret1', name: 'deloader',
  }, false)
  const old = token
  token = reg.data.token

  const d = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
  const rows = [['workout_id', 'workout', 'started', 'ended', 'exercise', 'muscle', 'weight_kg', 'reps', 'rpe']]
  for (const back of [10, 14, 18, 21]) {
    rows.push(['', `past ${back}`, `${d(back)} 10:00:00`, `${d(back)} 11:00:00`, 'bench press', 'chest', '100', '10', ''])
  }
  const imp = await req('POST', '/api/import/workouts', { csv: rows.map(r => r.join(',')).join('\n') })
  assert.equal(imp.status, 201)
  assert.equal(imp.data.workouts, 4)

  const r = await req('GET', '/api/stats/report')
  assert.equal(r.data.deload.flagged, true)
  assert.ok(r.data.deload.baseline > 0)
  token = old
})

test('food search requires a query', async () => {
  const r = await req('GET', '/api/foods/search')
  assert.equal(r.status, 400)
  const blank = await req('GET', '/api/foods/search?q=%20')
  assert.equal(blank.status, 400)
})

test('deletes an account and everything in it', async () => {
  const email = `bye${Date.now()}@fit.test`
  const reg = await req('POST', '/api/auth/register', { email, password: 'secret1', name: 'leaver' }, false)
  const old = token
  token = reg.data.token
  const w = await req('POST', '/api/workouts', { name: 'final workout' })
  await req('POST', `/api/workouts/${w.data.workout.id}/sets`, { exercise_id: 1, weight: 50, reps: 5 })

  const wrong = await req('POST', '/api/auth/delete', { password: 'nope' })
  assert.equal(wrong.status, 401)

  const del = await req('POST', '/api/auth/delete', { password: 'secret1' })
  assert.equal(del.status, 200)

  const login = await req('POST', '/api/auth/login', { email, password: 'secret1' }, false)
  assert.equal(login.status, 401)
  token = old
})
