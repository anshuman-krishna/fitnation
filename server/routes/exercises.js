const db = require('../db')
const { authed } = require('../middleware')

const muscles = ['chest', 'back', 'lats', 'lower back', 'shoulders', 'biceps', 'triceps',
  'legs', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'full body', 'cardio']
const difficulties = ['beginner', 'intermediate', 'advanced']

module.exports = app => {
  app.get('/api/exercises', authed, (req, res) => {
    const conditions = ['(user_id is null or user_id = ?)']
    const values = [req.user.id]
    if (req.query.muscle) {
      conditions.push('muscle = ?')
      values.push(req.query.muscle)
    }
    if (req.query.equipment) {
      conditions.push('equipment = ?')
      values.push(req.query.equipment)
    }
    if (req.query.q) {
      conditions.push('name like ?')
      values.push(`%${req.query.q}%`)
    }
    const rows = db.prepare(`select * from exercises where ${conditions.join(' and ')} order by name`)
      .all(...values)
    res.json(200, { exercises: rows })
  })

  app.post('/api/exercises', authed, (req, res) => {
    const name = (req.body.name || '').trim().toLowerCase()
    if (!name) return res.json(400, { error: 'name required' })
    const muscle = muscles.includes(req.body.muscle) ? req.body.muscle : 'full body'
    const difficulty = difficulties.includes(req.body.difficulty) ? req.body.difficulty : 'beginner'
    const equipment = (req.body.equipment || 'other').trim().toLowerCase()
    const dupe = db.prepare('select id from exercises where name = ? and (user_id is null or user_id = ?)')
      .get(name, req.user.id)
    if (dupe) return res.json(409, { error: 'exercise already exists' })
    const info = db.prepare('insert into exercises (name, muscle, equipment, difficulty, cues, user_id) values (?, ?, ?, ?, ?, ?)')
      .run(name, muscle, equipment, difficulty, (req.body.cues || '').trim(), req.user.id)
    res.json(201, { exercise: db.prepare('select * from exercises where id = ?').get(info.lastInsertRowid) })
  })

  app.delete('/api/exercises/:id', authed, (req, res) => {
    const ex = db.prepare('select * from exercises where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!ex) return res.json(404, { error: 'exercise not found or not yours' })
    const used = db.prepare('select count(*) as n from sets where exercise_id = ?').get(ex.id).n
    if (used) return res.json(409, { error: 'exercise has logged sets and cannot be deleted' })
    db.prepare('delete from exercises where id = ?').run(ex.id)
    res.json(200, { ok: true })
  })

  app.get('/api/exercises/:id/history', authed, (req, res) => {
    const rows = db.prepare(`
      select s.weight, s.reps, s.rpe, s.created, w.started, w.name as workout_name
      from sets s
      join workouts w on w.id = s.workout_id
      where s.exercise_id = ? and w.user_id = ?
      order by s.created desc
      limit 100
    `).all(req.params.id, req.user.id)
    const pr = db.prepare(`
      select max(s.weight) as max_weight, max(s.weight * s.reps) as max_volume,
        max(s.weight * (1 + s.reps / 30.0)) as est_1rm
      from sets s join workouts w on w.id = s.workout_id
      where s.exercise_id = ? and w.user_id = ?
    `).get(req.params.id, req.user.id)
    res.json(200, { history: rows, pr })
  })
}
