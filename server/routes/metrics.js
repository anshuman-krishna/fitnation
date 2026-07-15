const db = require('../db')
const { authed } = require('../middleware')

module.exports = app => {
  app.get('/api/weights', authed, (req, res) => {
    const rows = db.prepare('select * from weights where user_id = ? order by date desc limit 365')
      .all(req.user.id)
    res.json(200, { weights: rows })
  })

  app.post('/api/weights', authed, (req, res) => {
    const kg = +req.body.kg
    if (!kg || kg <= 0 || kg > 500) return res.json(400, { error: 'valid weight required' })
    const date = req.body.date || new Date().toISOString().slice(0, 10)
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
}
