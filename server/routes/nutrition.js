const db = require('../db')
const { authed } = require('../middleware')

module.exports = app => {
  app.get('/api/foods', authed, (req, res) => {
    let sql = 'select * from foods'
    const values = []
    if (req.query.q) {
      sql += ' where name like ?'
      values.push(`%${req.query.q}%`)
    }
    sql += ' order by name'
    res.json(200, { foods: db.prepare(sql).all(...values) })
  })

  app.post('/api/foods', authed, (req, res) => {
    const { name, cal, protein, carbs, fat, serving } = req.body
    if (!name || !name.trim()) return res.json(400, { error: 'name required' })
    const info = db.prepare('insert into foods (name, cal, protein, carbs, fat, serving) values (?, ?, ?, ?, ?, ?)')
      .run(name.trim().toLowerCase(), +cal || 0, +protein || 0, +carbs || 0, +fat || 0, serving || '1 serving')
    res.json(201, { food: db.prepare('select * from foods where id = ?').get(info.lastInsertRowid) })
  })

  app.get('/api/meals', authed, (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10)
    const meals = db.prepare(`
      select m.*, f.name, f.cal, f.protein, f.carbs, f.fat, f.serving
      from meals m join foods f on f.id = m.food_id
      where m.user_id = ? and m.date = ?
      order by m.id
    `).all(req.user.id, date)
    const totals = meals.reduce((t, m) => ({
      cal: t.cal + m.cal * m.qty,
      protein: t.protein + m.protein * m.qty,
      carbs: t.carbs + m.carbs * m.qty,
      fat: t.fat + m.fat * m.qty,
    }), { cal: 0, protein: 0, carbs: 0, fat: 0 })
    res.json(200, { meals, totals, date })
  })

  app.post('/api/meals', authed, (req, res) => {
    const { food_id, qty, slot, date } = req.body
    const food = db.prepare('select id from foods where id = ?').get(food_id)
    if (!food) return res.json(400, { error: 'invalid food' })
    const slots = ['breakfast', 'lunch', 'dinner', 'snack']
    const info = db.prepare('insert into meals (user_id, food_id, qty, slot, date) values (?, ?, ?, ?, ?)')
      .run(req.user.id, food_id, +qty || 1, slots.includes(slot) ? slot : 'snack',
        date || new Date().toISOString().slice(0, 10))
    const meal = db.prepare(`
      select m.*, f.name, f.cal, f.protein, f.carbs, f.fat, f.serving
      from meals m join foods f on f.id = m.food_id where m.id = ?
    `).get(info.lastInsertRowid)
    res.json(201, { meal })
  })

  app.post('/api/meals/copy', authed, (req, res) => {
    const from = req.body.from
    if (!from) return res.json(400, { error: 'source date required' })
    const date = req.body.date || new Date().toISOString().slice(0, 10)
    if (from === date) return res.json(400, { error: 'source and target dates are the same' })
    const slots = ['breakfast', 'lunch', 'dinner', 'snack']
    const slot = slots.includes(req.body.slot) ? req.body.slot : null
    let sql = 'select food_id, qty, slot from meals where user_id = ? and date = ?'
    const values = [req.user.id, from]
    if (slot) {
      sql += ' and slot = ?'
      values.push(slot)
    }
    const rows = db.prepare(sql).all(...values)
    if (!rows.length) return res.json(404, { error: 'nothing logged on that day' })
    const ins = db.prepare('insert into meals (user_id, food_id, qty, slot, date) values (?, ?, ?, ?, ?)')
    for (const r of rows) ins.run(req.user.id, r.food_id, r.qty, r.slot, date)
    res.json(201, { copied: rows.length })
  })

  app.delete('/api/meals/:id', authed, (req, res) => {
    const info = db.prepare('delete from meals where id = ? and user_id = ?')
      .run(req.params.id, req.user.id)
    if (!info.changes) return res.json(404, { error: 'meal not found' })
    res.json(200, { ok: true })
  })

  app.get('/api/water', authed, (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10)
    const total = db.prepare('select coalesce(sum(ml), 0) as ml from water where user_id = ? and date = ?')
      .get(req.user.id, date)
    res.json(200, { ml: total.ml, date })
  })

  app.post('/api/water', authed, (req, res) => {
    const ml = +req.body.ml || 250
    db.prepare('insert into water (user_id, ml, date) values (?, ?, ?)')
      .run(req.user.id, ml, req.body.date || new Date().toISOString().slice(0, 10))
    const date = req.body.date || new Date().toISOString().slice(0, 10)
    const total = db.prepare('select coalesce(sum(ml), 0) as ml from water where user_id = ? and date = ?')
      .get(req.user.id, date)
    res.json(201, { ml: total.ml })
  })
}
