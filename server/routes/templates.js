const db = require('../db')
const { authed } = require('../middleware')
const { text } = require('../validate')

const parse = t => ({ ...t, data: JSON.parse(t.data) })

module.exports = app => {
  app.get('/api/templates', authed, (req, res) => {
    const rows = db.prepare('select * from templates where user_id = ? order by created desc')
      .all(req.user.id)
    res.json(200, { templates: rows.map(parse) })
  })

  app.get('/api/templates/:id', authed, (req, res) => {
    const t = db.prepare('select * from templates where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!t) return res.json(404, { error: 'template not found' })
    res.json(200, { template: parse(t) })
  })

  app.post('/api/templates', authed, (req, res) => {
    const name = text(req.body.name, 80)
    if (!name) return res.json(400, { error: 'name required (80 characters max)' })
    if (Array.isArray(req.body.exercises) && req.body.exercises.length > 50) {
      return res.json(400, { error: 'templates cap at 50 exercises' })
    }

    let data = []
    if (req.body.workout_id) {
      const w = db.prepare('select id from workouts where id = ? and user_id = ?')
        .get(req.body.workout_id, req.user.id)
      if (!w) return res.json(404, { error: 'workout not found' })
      data = db.prepare(`
        select e.id, e.name, e.muscle from sets s
        join exercises e on e.id = s.exercise_id
        where s.workout_id = ? group by e.id order by min(s.id)
      `).all(w.id)
    } else if (Array.isArray(req.body.exercises) && req.body.exercises.length) {
      const marks = req.body.exercises.map(() => '?').join(',')
      data = db.prepare(`select id, name, muscle from exercises where id in (${marks})`)
        .all(...req.body.exercises.map(Number))
    }
    if (!data.length) return res.json(400, { error: 'template needs at least one exercise' })

    const info = db.prepare('insert into templates (user_id, name, data) values (?, ?, ?)')
      .run(req.user.id, name, JSON.stringify(data))
    const t = db.prepare('select * from templates where id = ?').get(info.lastInsertRowid)
    res.json(201, { template: parse(t) })
  })

  app.patch('/api/templates/:id', authed, (req, res) => {
    const t = db.prepare('select * from templates where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!t) return res.json(404, { error: 'template not found' })
    const name = req.body.name !== undefined ? text(req.body.name, 80) : t.name
    if (!name) return res.json(400, { error: 'name required (80 characters max)' })
    let data = JSON.parse(t.data)
    if (Array.isArray(req.body.exercises)) {
      if (!req.body.exercises.length) return res.json(400, { error: 'template needs at least one exercise' })
      if (req.body.exercises.length > 50) return res.json(400, { error: 'templates cap at 50 exercises' })
      const marks = req.body.exercises.map(() => '?').join(',')
      const rows = db.prepare(`select id, name, muscle from exercises where id in (${marks})`)
        .all(...req.body.exercises.map(Number))
      const byid = new Map(rows.map(r => [r.id, r]))
      data = req.body.exercises.map(id => byid.get(+id)).filter(Boolean)
      if (!data.length) return res.json(400, { error: 'template needs at least one exercise' })
    }
    db.prepare('update templates set name = ?, data = ? where id = ?')
      .run(name, JSON.stringify(data), t.id)
    res.json(200, { template: parse(db.prepare('select * from templates where id = ?').get(t.id)) })
  })

  app.delete('/api/templates/:id', authed, (req, res) => {
    const info = db.prepare('delete from templates where id = ? and user_id = ?')
      .run(req.params.id, req.user.id)
    if (!info.changes) return res.json(404, { error: 'template not found' })
    res.json(200, { ok: true })
  })

  app.post('/api/templates/:id/start', authed, (req, res) => {
    const t = db.prepare('select * from templates where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!t) return res.json(404, { error: 'template not found' })
    const info = db.prepare('insert into workouts (user_id, name, template_id) values (?, ?, ?)')
      .run(req.user.id, t.name, t.id)
    const workout = db.prepare('select * from workouts where id = ?').get(info.lastInsertRowid)
    res.json(201, { workout })
  })
}
