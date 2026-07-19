const db = require('../db')
const { authed } = require('../middleware')
const { text, optnum, day } = require('../validate')

const parse = r => ({ ...r, data: JSON.parse(r.data) })

module.exports = app => {
  app.get('/api/recipes', authed, (req, res) => {
    const rows = db.prepare('select * from recipes where user_id = ? order by created desc')
      .all(req.user.id)
    res.json(200, { recipes: rows.map(parse) })
  })

  app.post('/api/recipes', authed, (req, res) => {
    const name = text(req.body.name, 80)
    if (!name) return res.json(400, { error: 'name required (80 characters max)' })
    const items = Array.isArray(req.body.items) ? req.body.items.filter(i => i && i.food_id) : []
    if (!items.length) return res.json(400, { error: 'recipe needs at least one food' })
    if (items.length > 50) return res.json(400, { error: 'recipes cap at 50 foods' })
    const marks = items.map(() => '?').join(',')
    const foods = db.prepare(`select id, name from foods where id in (${marks})`)
      .all(...items.map(i => +i.food_id))
    const byid = new Map(foods.map(f => [f.id, f]))
    const data = items
      .filter(i => byid.has(+i.food_id))
      .map(i => ({ food_id: +i.food_id, name: byid.get(+i.food_id).name, qty: optnum(i.qty, 0.05, 100, 1) ?? 1 }))
    if (!data.length) return res.json(400, { error: 'recipe needs at least one valid food' })
    const info = db.prepare('insert into recipes (user_id, name, data) values (?, ?, ?)')
      .run(req.user.id, name, JSON.stringify(data))
    res.json(201, { recipe: parse(db.prepare('select * from recipes where id = ?').get(info.lastInsertRowid)) })
  })

  app.delete('/api/recipes/:id', authed, (req, res) => {
    const info = db.prepare('delete from recipes where id = ? and user_id = ?')
      .run(req.params.id, req.user.id)
    if (!info.changes) return res.json(404, { error: 'recipe not found' })
    res.json(200, { ok: true })
  })

  app.post('/api/recipes/:id/log', authed, (req, res) => {
    const r = db.prepare('select * from recipes where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!r) return res.json(404, { error: 'recipe not found' })
    const slots = ['breakfast', 'lunch', 'dinner', 'snack']
    const slot = slots.includes(req.body.slot) ? req.body.slot : 'snack'
    const date = day(req.body.date)
    if (!date) return res.json(400, { error: 'invalid date' })
    const items = JSON.parse(r.data)
    const ins = db.prepare('insert into meals (user_id, food_id, qty, slot, date) values (?, ?, ?, ?, ?)')
    let logged = 0
    for (const i of items) {
      const food = db.prepare('select id from foods where id = ?').get(i.food_id)
      if (!food) continue
      ins.run(req.user.id, i.food_id, i.qty, slot, date)
      logged++
    }
    if (!logged) return res.json(400, { error: 'recipe foods no longer exist' })
    res.json(201, { logged })
  })
}
