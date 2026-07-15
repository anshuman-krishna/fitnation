const db = require('../db')
const { authed } = require('../middleware')

const esc = v => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function csv(res, filename, header, rows) {
  res.writeHead(200, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="${filename}"`,
  })
  res.end(header.join(',') + '\n' + rows.map(r => r.map(esc).join(',')).join('\n') + '\n')
}

module.exports = app => {
  app.get('/api/export/workouts', authed, (req, res) => {
    const rows = db.prepare(`
      select w.id, w.name, w.started, w.ended, e.name as exercise, e.muscle,
        s.weight, s.reps, s.rpe
      from workouts w
      left join sets s on s.workout_id = w.id
      left join exercises e on e.id = s.exercise_id
      where w.user_id = ?
      order by w.started, s.id
    `).all(req.user.id)
    csv(res, 'fitnation-workouts.csv',
      ['workout_id', 'workout', 'started', 'ended', 'exercise', 'muscle', 'weight_kg', 'reps', 'rpe'],
      rows.map(r => [r.id, r.name, r.started, r.ended, r.exercise, r.muscle, r.weight, r.reps, r.rpe]))
  })

  app.get('/api/export/weights', authed, (req, res) => {
    const rows = db.prepare('select date, kg from weights where user_id = ? order by date')
      .all(req.user.id)
    csv(res, 'fitnation-weights.csv', ['date', 'kg'], rows.map(r => [r.date, r.kg]))
  })

  app.get('/api/export/meals', authed, (req, res) => {
    const rows = db.prepare(`
      select m.date, m.slot, f.name, m.qty, f.serving,
        f.cal * m.qty as cal, f.protein * m.qty as protein,
        f.carbs * m.qty as carbs, f.fat * m.qty as fat
      from meals m join foods f on f.id = m.food_id
      where m.user_id = ? order by m.date, m.id
    `).all(req.user.id)
    csv(res, 'fitnation-meals.csv',
      ['date', 'slot', 'food', 'qty', 'serving', 'cal', 'protein', 'carbs', 'fat'],
      rows.map(r => [r.date, r.slot, r.name, r.qty, r.serving, r.cal, r.protein, r.carbs, r.fat]))
  })
}
