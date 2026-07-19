const db = require('../db')
const { authed } = require('../middleware')
const { optext, optnum } = require('../validate')

module.exports = app => {
  app.get('/api/workouts', authed, (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const offset = Math.max(parseInt(req.query.offset) || 0, 0)
    const rows = db.prepare(`
      select w.*,
        count(s.id) as set_count,
        coalesce(sum(s.weight * s.reps), 0) as volume,
        count(distinct s.exercise_id) as exercise_count
      from workouts w
      left join sets s on s.workout_id = w.id
      where w.user_id = ?
      group by w.id
      order by w.started desc
      limit ? offset ?
    `).all(req.user.id, limit, offset)
    const total = db.prepare('select count(*) as n from workouts where user_id = ?').get(req.user.id).n
    res.json(200, { workouts: rows, total })
  })

  app.post('/api/workouts', authed, (req, res) => {
    const name = optext(req.body.name, 80, 'workout')
    const note = optext(req.body.note, 500, '')
    if (name === undefined || note === undefined) return res.json(400, { error: 'name max 80 chars, note max 500' })
    const info = db.prepare('insert into workouts (user_id, name, note) values (?, ?, ?)')
      .run(req.user.id, name, note)
    const workout = db.prepare('select * from workouts where id = ?').get(info.lastInsertRowid)
    res.json(201, { workout })
  })

  app.get('/api/workouts/:id', authed, (req, res) => {
    const workout = db.prepare('select * from workouts where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!workout) return res.json(404, { error: 'workout not found' })
    const sets = db.prepare(`
      select s.*, e.name as exercise_name, e.muscle
      from sets s join exercises e on e.id = s.exercise_id
      where s.workout_id = ?
      order by s.created, s.id
    `).all(workout.id)
    res.json(200, { workout, sets })
  })

  app.patch('/api/workouts/:id', authed, (req, res) => {
    const workout = db.prepare('select * from workouts where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!workout) return res.json(404, { error: 'workout not found' })
    const name = req.body.name !== undefined ? optext(req.body.name, 80, workout.name) : workout.name
    const note = req.body.note !== undefined ? optext(req.body.note, 500, workout.note) : workout.note
    if (name === undefined || note === undefined) return res.json(400, { error: 'name max 80 chars, note max 500' })
    const ended = req.body.finish ? new Date().toISOString().replace('T', ' ').slice(0, 19) : workout.ended
    db.prepare('update workouts set name = ?, note = ?, ended = ? where id = ?')
      .run(name, note, ended, workout.id)
    res.json(200, { workout: db.prepare('select * from workouts where id = ?').get(workout.id) })
  })

  app.delete('/api/workouts/:id', authed, (req, res) => {
    const info = db.prepare('delete from workouts where id = ? and user_id = ?')
      .run(req.params.id, req.user.id)
    if (!info.changes) return res.json(404, { error: 'workout not found' })
    res.json(200, { ok: true })
  })

  app.post('/api/workouts/:id/sets', authed, (req, res) => {
    const workout = db.prepare('select id from workouts where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!workout) return res.json(404, { error: 'workout not found' })
    const exercise = db.prepare('select id from exercises where id = ?').get(req.body.exercise_id)
    if (!exercise) return res.json(400, { error: 'invalid exercise' })
    const weight = optnum(req.body.weight, 0, 1000, 0)
    const reps = optnum(req.body.reps, 0, 1000, 0)
    const rpe = req.body.rpe == null ? null : optnum(req.body.rpe, 1, 10, null)
    const superset = req.body.superset == null ? null : optnum(req.body.superset, 1, 1e9, null)
    if ([weight, reps, rpe, superset].includes(undefined)) {
      return res.json(400, { error: 'weight 0-1000 kg, reps 0-1000, rpe 1-10' })
    }
    const prior = db.prepare(`
      select coalesce(max(s.weight * (1 + s.reps / 30.0)), 0) as best, count(s.id) as n
      from sets s join workouts w on w.id = s.workout_id
      where w.user_id = ? and s.exercise_id = ? and s.weight > 0
    `).get(req.user.id, exercise.id)
    const info = db.prepare('insert into sets (workout_id, exercise_id, weight, reps, rpe, superset) values (?, ?, ?, ?, ?, ?)')
      .run(workout.id, exercise.id, weight, reps, rpe, superset)
    const set = db.prepare(`
      select s.*, e.name as exercise_name, e.muscle
      from sets s join exercises e on e.id = s.exercise_id where s.id = ?
    `).get(info.lastInsertRowid)
    const pr = weight > 0 && prior.n > 0 && weight * (1 + reps / 30) > prior.best
    res.json(201, { set, pr })
  })

  app.delete('/api/workouts/:id/sets/:sid', authed, (req, res) => {
    const workout = db.prepare('select id from workouts where id = ? and user_id = ?')
      .get(req.params.id, req.user.id)
    if (!workout) return res.json(404, { error: 'workout not found' })
    const info = db.prepare('delete from sets where id = ? and workout_id = ?')
      .run(req.params.sid, workout.id)
    if (!info.changes) return res.json(404, { error: 'set not found' })
    res.json(200, { ok: true })
  })
}
