const db = require('../db')
const { authed } = require('../middleware')
const { text, num, dateish, datetimeish } = require('../validate')

function parsecsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch !== '\r') cell += ch
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.length > 1 || (r[0] || '').trim())
}

function records(csv, required) {
  const rows = parsecsv(typeof csv === 'string' ? csv : '')
  if (rows.length < 2 || rows.length > 10001) return null
  const header = rows[0].map(h => h.trim().toLowerCase())
  if (!required.every(c => header.includes(c))) return null
  return rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])))
}

module.exports = app => {
  app.post('/api/import/weights', authed, (req, res) => {
    const rows = records(req.body.csv, ['date', 'kg'])
    if (!rows) return res.json(400, { error: 'expected csv with date,kg columns' })
    let imported = 0
    for (const r of rows) {
      const kg = num(r.kg, 1, 500)
      if (!dateish(r.date) || kg === undefined) continue
      const existing = db.prepare('select id from weights where user_id = ? and date = ?')
        .get(req.user.id, r.date)
      if (existing) db.prepare('update weights set kg = ? where id = ?').run(kg, existing.id)
      else db.prepare('insert into weights (user_id, kg, date) values (?, ?, ?)').run(req.user.id, kg, r.date)
      imported++
    }
    res.json(201, { imported })
  })

  app.post('/api/import/meals', authed, (req, res) => {
    const rows = records(req.body.csv, ['date', 'slot', 'food', 'qty'])
    if (!rows) return res.json(400, { error: 'expected csv with date,slot,food,qty columns' })
    const slots = ['breakfast', 'lunch', 'dinner', 'snack']
    let imported = 0
    for (const r of rows) {
      const qty = num(r.qty, 0.05, 100) ?? 1
      const name = text((r.food || '').toLowerCase(), 80)
      if (!dateish(r.date) || !name) continue
      let food = db.prepare('select id from foods where name = ?').get(name)
      if (!food) {
        const info = db.prepare('insert into foods (name, cal, protein, carbs, fat, serving) values (?, ?, ?, ?, ?, ?)')
          .run(name, (+r.cal || 0) / qty, (+r.protein || 0) / qty, (+r.carbs || 0) / qty,
            (+r.fat || 0) / qty, r.serving || '1 serving')
        food = { id: info.lastInsertRowid }
      }
      const slot = slots.includes(r.slot) ? r.slot : 'snack'
      const dupe = db.prepare('select id from meals where user_id = ? and date = ? and slot = ? and food_id = ? and qty = ?')
        .get(req.user.id, r.date, slot, food.id, qty)
      if (dupe) continue
      db.prepare('insert into meals (user_id, food_id, qty, slot, date) values (?, ?, ?, ?, ?)')
        .run(req.user.id, food.id, qty, slot, r.date)
      imported++
    }
    res.json(201, { imported })
  })

  app.post('/api/import/workouts', authed, (req, res) => {
    const rows = records(req.body.csv, ['workout', 'started', 'exercise', 'weight_kg', 'reps'])
    if (!rows) return res.json(400, { error: 'expected csv with workout,started,exercise,weight_kg,reps columns' })
    const groups = new Map()
    for (const r of rows) {
      const key = `${r.workout_id || r.workout}|${r.started}`
      if (!groups.has(key)) {
        groups.set(key, {
          name: text(r.workout, 80) ?? 'workout',
          started: r.started,
          ended: datetimeish(r.ended) ? r.ended : null,
          sets: [],
        })
      }
      if (r.exercise) groups.get(key).sets.push(r)
    }
    let workouts = 0
    let sets = 0
    for (const g of groups.values()) {
      if (!datetimeish(g.started)) continue
      const dupe = db.prepare('select id from workouts where user_id = ? and name = ? and started = ?')
        .get(req.user.id, g.name, g.started)
      if (dupe) continue
      const info = db.prepare('insert into workouts (user_id, name, started, ended) values (?, ?, ?, ?)')
        .run(req.user.id, g.name, g.started, g.ended)
      workouts++
      const ins = db.prepare('insert into sets (workout_id, exercise_id, weight, reps, rpe, created) values (?, ?, ?, ?, ?, ?)')
      for (const s of g.sets) {
        const name = text(s.exercise.toLowerCase(), 80)
        if (!name) continue
        let ex = db.prepare('select id from exercises where name = ? and (user_id is null or user_id = ?)')
          .get(name, req.user.id)
        if (!ex) {
          const created = db.prepare('insert into exercises (name, muscle, equipment, difficulty, cues, user_id) values (?, ?, ?, ?, ?, ?)')
            .run(name, s.muscle || 'full body', 'other', 'beginner', '', req.user.id)
          ex = { id: created.lastInsertRowid }
        }
        ins.run(info.lastInsertRowid, ex.id, num(s.weight_kg, 0, 1000) ?? 0, num(s.reps, 0, 1000) ?? 0,
          num(s.rpe, 1, 10) ?? null, g.started)
        sets++
      }
    }
    res.json(201, { workouts, sets })
  })

  app.post('/api/import/sessions', authed, (req, res) => {
    const list = Array.isArray(req.body.sessions) ? req.body.sessions : null
    if (!list || !list.length || list.length > 2000) {
      return res.json(400, { error: 'expected sessions: [{ name, started, ended }] (max 2000)' })
    }
    const dupe = db.prepare('select id from workouts where user_id = ? and name = ? and started = ?')
    const ins = db.prepare('insert into workouts (user_id, name, started, ended) values (?, ?, ?, ?)')
    let imported = 0
    for (const s of list) {
      if (!s || !datetimeish(s.started)) continue
      const name = text(s.name, 80) ?? 'workout'
      const ended = datetimeish(s.ended) ? s.ended : null
      if (dupe.get(req.user.id, name, s.started)) continue
      ins.run(req.user.id, name, s.started, ended)
      imported++
    }
    res.json(201, { imported })
  })
}
