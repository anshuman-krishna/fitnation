const db = require('../db')
const { hash, verify, issue } = require('../auth')
const { authed } = require('../middleware')
const { text, num, emailish } = require('../validate')

const safe = u => {
  const { password, ...rest } = u
  return rest
}

const fails = new Map()
const window = 15 * 60000
const maxfails = 8

function locked(key) {
  const f = fails.get(key)
  if (!f) return false
  if (Date.now() > f.reset) {
    fails.delete(key)
    return false
  }
  return f.count >= maxfails
}

function markfail(key) {
  const f = fails.get(key) || { count: 0, reset: Date.now() + window }
  if (Date.now() > f.reset) {
    f.count = 0
    f.reset = Date.now() + window
  }
  f.count++
  fails.set(key, f)
}

function guard(req, id) {
  return `${req.socket.remoteAddress || 'unknown'}|${id}`
}

const badpw = p => typeof p !== 'string' || p.length > 200

module.exports = app => {
  app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body
    if (!emailish(email)) return res.json(400, { error: 'valid email required' })
    if (badpw(password) || password.length < 6) return res.json(400, { error: 'password must be 6 to 200 characters' })
    const name = text(req.body.name, 60)
    if (!name) return res.json(400, { error: 'name required (60 characters max)' })

    const existing = db.prepare('select id from users where email = ?').get(email.toLowerCase())
    if (existing) return res.json(409, { error: 'email already registered' })

    const info = db.prepare('insert into users (email, password, name) values (?, ?, ?)')
      .run(email.toLowerCase(), hash(password), name)
    const user = db.prepare('select * from users where id = ?').get(info.lastInsertRowid)
    res.json(201, { token: issue(user), user: safe(user) })
  })

  app.post('/api/auth/login', (req, res) => {
    const email = (typeof req.body.email === 'string' ? req.body.email : '').toLowerCase()
    const key = guard(req, email)
    if (locked(key)) return res.json(429, { error: 'too many failed attempts. wait 15 minutes' })
    const user = db.prepare('select * from users where email = ?').get(email)
    if (!user || badpw(req.body.password) || !verify(req.body.password || '', user.password)) {
      markfail(key)
      return res.json(401, { error: 'invalid email or password' })
    }
    fails.delete(key)
    res.json(200, { token: issue(user), user: safe(user) })
  })

  app.get('/api/auth/me', authed, (req, res) => {
    const user = db.prepare('select * from users where id = ?').get(req.user.id)
    if (!user) return res.json(404, { error: 'user not found' })
    res.json(200, { user: safe(user) })
  })

  app.patch('/api/auth/password', authed, (req, res) => {
    const { current, next } = req.body
    if (badpw(next) || next.length < 6) return res.json(400, { error: 'new password must be 6 to 200 characters' })
    const key = guard(req, req.user.id)
    if (locked(key)) return res.json(429, { error: 'too many failed attempts. wait 15 minutes' })
    const user = db.prepare('select * from users where id = ?').get(req.user.id)
    if (!user || badpw(current) || !verify(current || '', user.password)) {
      markfail(key)
      return res.json(401, { error: 'current password is wrong' })
    }
    fails.delete(key)
    db.prepare('update users set password = ? where id = ?').run(hash(next), user.id)
    res.json(200, { ok: true })
  })

  app.post('/api/auth/delete', authed, (req, res) => {
    const key = guard(req, req.user.id)
    if (locked(key)) return res.json(429, { error: 'too many failed attempts. wait 15 minutes' })
    const user = db.prepare('select * from users where id = ?').get(req.user.id)
    if (!user || badpw(req.body.password) || !verify(req.body.password || '', user.password)) {
      markfail(key)
      return res.json(401, { error: 'password is wrong' })
    }
    fails.delete(key)
    db.prepare('delete from users where id = ?').run(user.id)
    db.prepare('delete from exercises where user_id = ? and id not in (select distinct exercise_id from sets)')
      .run(user.id)
    res.json(200, { ok: true })
  })

  app.patch('/api/auth/me', authed, (req, res) => {
    const rules = {
      name: v => text(v, 60),
      goal_cal: v => num(v, 800, 10000),
      goal_protein: v => num(v, 10, 500),
      goal_water: v => num(v, 250, 10000),
      goal_weight: v => v === null ? null : num(v, 20, 400),
      goal_workouts: v => num(v, 1, 14),
      units: v => ['metric', 'imperial'].includes(v) ? v : undefined,
    }
    const updates = []
    const values = []
    for (const [f, rule] of Object.entries(rules)) {
      if (req.body[f] === undefined) continue
      const v = rule(req.body[f])
      if (v === undefined) return res.json(400, { error: `invalid ${f.replace('_', ' ')}` })
      updates.push(`${f} = ?`)
      values.push(v)
    }
    if (!updates.length) return res.json(400, { error: 'nothing to update' })
    values.push(req.user.id)
    db.prepare(`update users set ${updates.join(', ')} where id = ?`).run(...values)
    const user = db.prepare('select * from users where id = ?').get(req.user.id)
    res.json(200, { user: safe(user) })
  })
}
