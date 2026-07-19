const db = require('../db')
const { authed } = require('../middleware')
const { text, optext, optnum, day, dateish } = require('../validate')

const offheaders = { 'user-agent': 'fitnation/4.0 (personal fitness tracker)' }

function offfood(p) {
  if (!p || !p.product_name || !p.nutriments || p.nutriments['energy-kcal_100g'] == null) return null
  const title = p.product_name.trim().toLowerCase()
  if (!title || title.length > 80) return null
  const brand = (p.brands || '').split(',')[0].trim().toLowerCase()
  const name = brand && brand !== title && (title.length + brand.length) < 76 ? `${title} (${brand})` : title
  return {
    name,
    cal: Math.round(+p.nutriments['energy-kcal_100g'] || 0),
    protein: Math.round((+p.nutriments.proteins_100g || 0) * 10) / 10,
    carbs: Math.round((+p.nutriments.carbohydrates_100g || 0) * 10) / 10,
    fat: Math.round((+p.nutriments.fat_100g || 0) * 10) / 10,
    serving: '100 g',
  }
}

module.exports = app => {
  app.get('/api/foods', authed, (req, res) => {
    let sql = 'select * from foods'
    const values = []
    if (req.query.q) {
      sql += ' where name like ?'
      values.push(`%${req.query.q.slice(0, 80)}%`)
    }
    sql += ' order by name'
    res.json(200, { foods: db.prepare(sql).all(...values) })
  })

  app.get('/api/foods/search', authed, async (req, res) => {
    const q = (req.query.q || '').trim()
    if (!q) return res.json(400, { error: 'search query required' })
    if (q.length > 100) return res.json(400, { error: 'search query too long' })
    try {
      const url = 'https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&search_simple=1&page_size=12' +
        '&fields=product_name,brands,nutriments&search_terms=' + encodeURIComponent(q)
      const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: offheaders })
      if (!r.ok) throw new Error()
      const data = await r.json()
      const seen = new Set()
      const results = []
      for (const p of data.products || []) {
        const food = offfood(p)
        if (!food || seen.has(food.name)) continue
        seen.add(food.name)
        results.push(food)
        if (results.length === 10) break
      }
      res.json(200, { results })
    } catch {
      res.json(502, { error: 'open food facts is unreachable right now' })
    }
  })

  app.get('/api/foods/barcode/:code', authed, async (req, res) => {
    if (!/^\d{6,14}$/.test(req.params.code)) return res.json(400, { error: 'invalid barcode' })
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${req.params.code}.json` +
        '?fields=product_name,brands,nutriments'
      const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: offheaders })
      if (r.status === 404) return res.json(404, { error: 'barcode not in open food facts' })
      if (!r.ok) throw new Error()
      const data = await r.json()
      const food = data.status === 1 ? offfood(data.product) : null
      if (!food) return res.json(404, { error: 'no nutrition data for that barcode' })
      res.json(200, { food })
    } catch {
      res.json(502, { error: 'open food facts is unreachable right now' })
    }
  })

  app.post('/api/foods', authed, (req, res) => {
    const name = text(typeof req.body.name === 'string' ? req.body.name.toLowerCase() : '', 80)
    const cal = optnum(req.body.cal, 0, 5000, 0)
    const protein = optnum(req.body.protein, 0, 1000, 0)
    const carbs = optnum(req.body.carbs, 0, 1000, 0)
    const fat = optnum(req.body.fat, 0, 1000, 0)
    const serving = optext(req.body.serving, 40, '1 serving')
    if (!name) return res.json(400, { error: 'name required (80 characters max)' })
    if ([cal, protein, carbs, fat, serving].includes(undefined)) {
      return res.json(400, { error: 'macros out of range' })
    }
    const info = db.prepare('insert into foods (name, cal, protein, carbs, fat, serving) values (?, ?, ?, ?, ?, ?)')
      .run(name, cal, protein, carbs, fat, serving)
    res.json(201, { food: db.prepare('select * from foods where id = ?').get(info.lastInsertRowid) })
  })

  app.get('/api/meals', authed, (req, res) => {
    const date = day(req.query.date)
    if (!date) return res.json(400, { error: 'invalid date' })
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
    const food = db.prepare('select id from foods where id = ?').get(req.body.food_id)
    if (!food) return res.json(400, { error: 'invalid food' })
    const qty = optnum(req.body.qty, 0.05, 100, 1)
    const date = day(req.body.date)
    if (qty === undefined || !date) return res.json(400, { error: 'qty 0.05-100, date yyyy-mm-dd' })
    const slots = ['breakfast', 'lunch', 'dinner', 'snack']
    const info = db.prepare('insert into meals (user_id, food_id, qty, slot, date) values (?, ?, ?, ?, ?)')
      .run(req.user.id, food.id, qty, slots.includes(req.body.slot) ? req.body.slot : 'snack', date)
    const meal = db.prepare(`
      select m.*, f.name, f.cal, f.protein, f.carbs, f.fat, f.serving
      from meals m join foods f on f.id = m.food_id where m.id = ?
    `).get(info.lastInsertRowid)
    res.json(201, { meal })
  })

  app.post('/api/meals/copy', authed, (req, res) => {
    const from = req.body.from
    if (!dateish(from)) return res.json(400, { error: 'source date required' })
    const date = day(req.body.date)
    if (!date) return res.json(400, { error: 'invalid date' })
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
    const date = day(req.query.date)
    if (!date) return res.json(400, { error: 'invalid date' })
    const total = db.prepare('select coalesce(sum(ml), 0) as ml from water where user_id = ? and date = ?')
      .get(req.user.id, date)
    res.json(200, { ml: total.ml, date })
  })

  app.post('/api/water', authed, (req, res) => {
    const ml = optnum(req.body.ml, 1, 5000, 250)
    const date = day(req.body.date)
    if (ml === undefined || !date) return res.json(400, { error: 'ml 1-5000, date yyyy-mm-dd' })
    db.prepare('insert into water (user_id, ml, date) values (?, ?, ?)')
      .run(req.user.id, ml, date)
    const total = db.prepare('select coalesce(sum(ml), 0) as ml from water where user_id = ? and date = ?')
      .get(req.user.id, date)
    res.json(201, { ml: total.ml })
  })
}
