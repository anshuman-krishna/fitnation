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
