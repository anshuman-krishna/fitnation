const db = require('../db')
const { authed } = require('../middleware')
const { num, day } = require('../validate')

module.exports = app => {
  app.get('/api/weights', authed, (req, res) => {
    const rows = db.prepare('select * from weights where user_id = ? order by date desc limit 365')
      .all(req.user.id)
    res.json(200, { weights: rows })
  })

  app.post('/api/weights', authed, (req, res) => {
    const kg = num(req.body.kg, 1, 500)
    if (kg === undefined) return res.json(400, { error: 'valid weight required (1-500 kg)' })
    const date = day(req.body.date)
    if (!date) return res.json(400, { error: 'invalid date' })
    const existing = db.prepare('select id from weights where user_id = ? and date = ?')
      .get(req.user.id, date)
    if (existing) {
      db.prepare('update weights set kg = ? where id = ?').run(kg, existing.id)
    } else {
      db.prepare('insert into weights (user_id, kg, date) values (?, ?, ?)').run(req.user.id, kg, date)
    }
    res.json(201, { ok: true })
  })

  app.delete('/api/weights/:id', authed, (req, res) => {
    const info = db.prepare('delete from weights where id = ? and user_id = ?')
      .run(req.params.id, req.user.id)
    if (!info.changes) return res.json(404, { error: 'entry not found' })
    res.json(200, { ok: true })
  })

  const kinds = ['waist', 'chest', 'arms', 'hips', 'thighs', 'calves', 'neck', 'shoulders']

  app.get('/api/measurements', authed, (req, res) => {
    let sql = 'select * from measurements where user_id = ?'
    const values = [req.user.id]
    if (req.query.kind) {
      sql += ' and kind = ?'
      values.push(req.query.kind)
    }
    sql += ' order by date desc limit 365'
    res.json(200, { measurements: db.prepare(sql).all(...values), kinds })
  })

  app.post('/api/measurements', authed, (req, res) => {
    const { kind } = req.body
    if (!kinds.includes(kind)) return res.json(400, { error: 'invalid measurement kind' })
    const v = num(req.body.value, 1, 500)
    if (v === undefined) return res.json(400, { error: 'valid value required (1-500 cm)' })
    const date = day(req.body.date)
    if (!date) return res.json(400, { error: 'invalid date' })
    const existing = db.prepare('select id from measurements where user_id = ? and kind = ? and date = ?')
      .get(req.user.id, kind, date)
    if (existing) {
      db.prepare('update measurements set value = ? where id = ?').run(v, existing.id)
    } else {
      db.prepare('insert into measurements (user_id, kind, value, date) values (?, ?, ?, ?)')
        .run(req.user.id, kind, v, date)
    }
    res.json(201, { ok: true })
  })

  app.delete('/api/measurements/:id', authed, (req, res) => {
    const info = db.prepare('delete from measurements where id = ? and user_id = ?')
      .run(req.params.id, req.user.id)
    if (!info.changes) return res.json(404, { error: 'entry not found' })
    res.json(200, { ok: true })
  })
}
