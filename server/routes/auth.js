const db = require('../db')
const { hash, verify, issue } = require('../auth')
const { authed } = require('../middleware')

const safe = u => {
  const { password, ...rest } = u
  return rest
}

module.exports = app => {
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body
    if (!email || !email.includes('@')) return res.json(400, { error: 'valid email required' })
    if (!password || password.length < 6) return res.json(400, { error: 'password must be at least 6 characters' })
    if (!name || !name.trim()) return res.json(400, { error: 'name required' })

    const existing = db.prepare('select id from users where email = ?').get(email.toLowerCase())
    if (existing) return res.json(409, { error: 'email already registered' })

    const info = db.prepare('insert into users (email, password, name) values (?, ?, ?)')
      .run(email.toLowerCase(), hash(password), name.trim())
    const user = db.prepare('select * from users where id = ?').get(info.lastInsertRowid)
    res.json(201, { token: issue(user), user: safe(user) })
  })

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body
    const user = db.prepare('select * from users where email = ?').get((email || '').toLowerCase())
    if (!user || !verify(password || '', user.password)) {
      return res.json(401, { error: 'invalid email or password' })
    }
    res.json(200, { token: issue(user), user: safe(user) })
  })

  app.get('/api/auth/me', authed, (req, res) => {
    const user = db.prepare('select * from users where id = ?').get(req.user.id)
    if (!user) return res.json(404, { error: 'user not found' })
    res.json(200, { user: safe(user) })
  })

  app.patch('/api/auth/password', authed, (req, res) => {
    const { current, next } = req.body
    if (!next || next.length < 6) return res.json(400, { error: 'new password must be at least 6 characters' })
    const user = db.prepare('select * from users where id = ?').get(req.user.id)
    if (!user || !verify(current || '', user.password)) {
      return res.json(401, { error: 'current password is wrong' })
    }
    db.prepare('update users set password = ? where id = ?').run(hash(next), user.id)
    res.json(200, { ok: true })
  })

  app.patch('/api/auth/me', authed, (req, res) => {
    const fields = ['name', 'goal_cal', 'goal_protein', 'goal_water', 'goal_weight', 'goal_workouts', 'units']
    const updates = []
    const values = []
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`)
        values.push(req.body[f])
      }
    }
    if (!updates.length) return res.json(400, { error: 'nothing to update' })
    values.push(req.user.id)
    db.prepare(`update users set ${updates.join(', ')} where id = ?`).run(...values)
    const user = db.prepare('select * from users where id = ?').get(req.user.id)
    res.json(200, { user: safe(user) })
  })
}
